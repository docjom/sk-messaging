import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { webrtcService } from "../services/webrtc";

export const useCall = (currentUserId) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to prevent stale closures
  const incomingCallRef = useRef(null);
  const currentCallRef = useRef(null);
  const unsubscribersRef = useRef([]);

  // Update refs when state changes
  useEffect(() => {
    incomingCallRef.current = incomingCall;
    currentCallRef.current = currentCall;
  }, [incomingCall, currentCall]);

  useEffect(() => {
    if (!currentUserId) return;

    webrtcService.setUserId(currentUserId);

    // Listen for incoming calls
    const userUnsubscribe = onSnapshot(
      doc(db, "users", currentUserId),
      (snapshot) => {
        const userData = snapshot.data();
        console.log("User data updated:", userData);

        if (userData?.currentCallId && !currentCallRef.current) {
          console.log("Found incoming call ID:", userData.currentCallId);

          // Check if this is an incoming call
          const callUnsubscribe = onSnapshot(
            doc(db, "calls", userData.currentCallId),
            (callSnapshot) => {
              const callData = callSnapshot.data();
              console.log("Call data:", callData);

              if (
                callData &&
                callData.callee === currentUserId &&
                callData.status === "pending"
              ) {
                console.log("Setting incoming call");
                setIncomingCall({
                  id: userData.currentCallId,
                  caller: callData.caller,
                  type: callData.type,
                  data: callData,
                });
              } else if (
                callData?.status === "rejected" ||
                callData?.status === "ended"
              ) {
                console.log("Call was rejected or ended, cleaning up");
                setIncomingCall(null);
                setCurrentCall(null);
              }
            }
          );

          unsubscribersRef.current.push(callUnsubscribe);
        }
      }
    );

    // Set up WebRTC callbacks
    webrtcService.onRemoteStream((stream) => {
      console.log("Remote stream received");
      setRemoteStream(stream);
      setIsConnected(true);
    });

    webrtcService.onCallEnd(() => {
      console.log("Call ended callback triggered");
      setCurrentCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setIncomingCall(null);
    });

    unsubscribersRef.current.push(userUnsubscribe);

    return () => {
      console.log("Cleaning up useCall hook");
      unsubscribersRef.current.forEach((unsub) => unsub && unsub());
      unsubscribersRef.current = [];

      // Don't end call on cleanup if there's an active call
      if (!currentCallRef.current) {
        webrtcService.endCall();
      }
    };
  }, [currentUserId]);

  const startCall = useCallback(
    async (calleeId, type = "audio") => {
      try {
        console.log("Starting call to:", calleeId, "type:", type);

        const stream = await webrtcService.getUserMedia(true, type === "video");
        setLocalStream(stream);
        console.log("Local stream obtained");

        const callId = await webrtcService.startCall(calleeId, type);
        console.log("Call started with ID:", callId);

        setCurrentCall({
          id: callId,
          type,
          isOutgoing: true,
        });

        // Update caller status
        await updateDoc(doc(db, "users", currentUserId), {
          inCall: true,
          currentCallId: callId,
        });

        // Update callee status
        await updateDoc(doc(db, "users", calleeId), {
          currentCallId: callId,
        });

        console.log("User statuses updated");
      } catch (error) {
        console.error("Error starting call:", error);
        // Clean up on error
        setCurrentCall(null);
        setLocalStream(null);
      }
    },
    [currentUserId]
  );

  const answerCall = useCallback(async () => {
    if (!incomingCallRef.current) {
      console.log("No incoming call to answer");
      return;
    }

    try {
      console.log("Answering call:", incomingCallRef.current.id);

      const stream = await webrtcService.getUserMedia(
        true,
        incomingCallRef.current.type === "video"
      );
      setLocalStream(stream);
      console.log("Local stream obtained for answer");

      await webrtcService.answerCall(incomingCallRef.current.id);
      console.log("Call answered");

      setCurrentCall({
        id: incomingCallRef.current.id,
        type: incomingCallRef.current.type,
        isOutgoing: false,
      });

      // Update user status
      await updateDoc(doc(db, "users", currentUserId), {
        inCall: true,
      });

      setIncomingCall(null);
      console.log("Answer call completed");
    } catch (error) {
      console.error("Error answering call:", error);
      setIncomingCall(null);
    }
  }, [currentUserId]);

  const rejectCall = useCallback(async () => {
    if (!incomingCallRef.current) {
      console.log("No incoming call to reject");
      return;
    }

    try {
      console.log("Rejecting call:", incomingCallRef.current.id);

      await updateDoc(doc(db, "calls", incomingCallRef.current.id), {
        status: "rejected",
      });

      await updateDoc(doc(db, "users", currentUserId), {
        currentCallId: null,
      });

      // Also update the caller's status
      if (incomingCallRef.current.data?.caller) {
        await updateDoc(doc(db, "users", incomingCallRef.current.data.caller), {
          currentCallId: null,
        });
      }

      setIncomingCall(null);
      console.log("Call rejected");
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }, [currentUserId]);

  const endCall = useCallback(async () => {
    try {
      console.log("Ending call");
      await webrtcService.endCall();

      // The webrtcService.endCall() should trigger the onCallEnd callback
      // which will clean up the state, but we'll also do it here as backup
      setCurrentCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);

      console.log("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, []);

  return {
    incomingCall,
    currentCall,
    localStream,
    remoteStream,
    isConnected,
    startCall,
    answerCall,
    rejectCall,
    endCall,
  };
};
