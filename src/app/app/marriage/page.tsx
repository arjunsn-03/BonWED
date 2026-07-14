"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MarriageIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/marriage/venue");
  }, [router]);
  return null;
}
