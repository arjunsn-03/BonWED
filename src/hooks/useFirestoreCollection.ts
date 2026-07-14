"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Subscribe to a Firestore collection with optional query constraints.
 * Returns the live array of documents plus loading/error state.
 */
export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = collection(db, collectionName);
    const q = constraints.length ? query(ref, ...constraints) : query(ref);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}
