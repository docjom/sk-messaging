import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useEffect } from "react";
import { useSystemStore } from "@/stores/useSystemStore";

const systemDocRef = doc(db, "system", "config");

export function useSystemMaintenance() {
  const { isSystemUnderMaintenance, setSystemUnderMaintenance } =
    useSystemStore();

  useEffect(() => {
    const unsub = onSnapshot(systemDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSystemUnderMaintenance(docSnap.data().maintenance);
      }
    });

    return () => unsub();
  }, [setSystemUnderMaintenance]);

  // 🔹 Toggle maintenance in Firestore
  const handleMaintenanceToggle = async (checked) => {
    await updateDoc(systemDocRef, {
      maintenance: checked,
    });
  };

  return { isSystemUnderMaintenance, handleMaintenanceToggle };
}
