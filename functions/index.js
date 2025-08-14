import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();

export const createUserAccount = onCall(async (request) => {
  const data = request.data;
  const { email, password, name, position, department, phone, role } =
    data || {};

  if (!email || !password || !name) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        displayName: name,
        email,
        photoURL: "",
        active: false,
        position: position,
        department: department,
        phone: phone,
        role: role ?? "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        provider: "email",
      });

    return { uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new HttpsError("internal", error.message);
  }
});
