import {
  doc,
  //setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  getDoc, // Add this import
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.callId = null;
    this.userId = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;
  }

  async initializePeerConnection() {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.addIceCandidate(event.candidate);
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };
  }

  async getUserMedia(audio = true, video = false) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  async startCall(calleeId, type = "audio") {
    await this.initializePeerConnection();

    // Get user media
    const stream = await this.getUserMedia(true, type === "video");

    // Add stream to peer connection
    stream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, stream);
    });

    // Create call document
    const callRef = await addDoc(collection(db, "calls"), {
      caller: this.userId,
      callee: calleeId,
      status: "pending",
      type,
      createdAt: serverTimestamp(),
      iceCandidates: [],
    });

    this.callId = callRef.id;

    // Create and set local description
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Save offer to Firestore
    await updateDoc(callRef, {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });

    // Listen for answer
    this.listenForAnswer();
    this.listenForIceCandidates();

    return this.callId;
  }

  async answerCall(callId) {
    this.callId = callId;
    await this.initializePeerConnection();

    const callDoc = doc(db, "calls", callId);

    // Get call data - Fixed: use getDoc() instead of callDoc.get()
    const callSnapshot = await getDoc(callDoc);
    const callData = callSnapshot.data();

    // Get user media
    const stream = await this.getUserMedia(true, callData.type === "video");

    // Add stream to peer connection
    stream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, stream);
    });

    // Set remote description from offer
    await this.peerConnection.setRemoteDescription(callData.offer);

    // Create and set local description (answer)
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Save answer and update status
    await updateDoc(callDoc, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
      status: "accepted",
    });

    this.listenForIceCandidates();
  }

  async listenForAnswer() {
    const callDoc = doc(db, "calls", this.callId);

    const unsubscribe = onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && this.peerConnection.signalingState !== "stable") {
        await this.peerConnection.setRemoteDescription(data.answer);
        unsubscribe();
      }
    });
  }

  async listenForIceCandidates() {
    const callDoc = doc(db, "calls", this.callId);

    onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.iceCandidates && this.peerConnection) {
        for (const candidateData of data.iceCandidates) {
          if (!candidateData.processed) {
            try {
              const candidate = new RTCIceCandidate(candidateData);
              await this.peerConnection.addIceCandidate(candidate);

              // Mark as processed to avoid re-adding
              candidateData.processed = true;
              await updateDoc(callDoc, {
                iceCandidates: data.iceCandidates,
              });
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
              // Mark as processed even if it failed to avoid retrying
              candidateData.processed = true;
              await updateDoc(callDoc, {
                iceCandidates: data.iceCandidates,
              });
            }
          }
        }
      }
    });
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection || !this.callId) {
      console.warn(
        "Cannot add ICE candidate: peer connection or call ID not available"
      );
      return;
    }

    try {
      const callDoc = doc(db, "calls", this.callId);
      // Fixed: use getDoc() instead of callDoc.get()
      const callSnapshot = await getDoc(callDoc);
      const currentCandidates = callSnapshot.data()?.iceCandidates || [];

      await updateDoc(callDoc, {
        iceCandidates: [
          ...currentCandidates,
          {
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid,
            processed: false,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding ICE candidate to Firestore:", error);
    }
  }

  async endCall() {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Reset remote stream
    this.remoteStream = null;

    // Update call status
    if (this.callId) {
      try {
        const callDoc = doc(db, "calls", this.callId);
        await updateDoc(callDoc, {
          status: "ended",
        });
      } catch (error) {
        console.error("Error updating call status:", error);
      }
    }

    // Update user status
    if (this.userId) {
      try {
        const userDoc = doc(db, "users", this.userId);
        await updateDoc(userDoc, {
          inCall: false,
          currentCallId: null,
        });
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    }

    // Reset call ID after cleanup
    this.callId = null;

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  setUserId(userId) {
    this.userId = userId;
  }

  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback) {
    this.onCallEndCallback = callback;
  }
}

export const webrtcService = new WebRTCService();
