"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Subscribe to a single Firestore document.
 */
export function useFirestoreDoc<T = DocumentData>(
  collectionName: string,
  docId: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    const ref = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName, docId]);

  return { data, loading, error };
}
