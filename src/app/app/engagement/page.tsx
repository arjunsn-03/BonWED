"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EngagementIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/engagement/venue");
  }, [router]);
  return null;
}
