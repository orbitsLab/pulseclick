"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InitialLoaderScreen } from "@/components/motion/loader";

function RootRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/tasks?${qs}` : "/tasks");
  }, [router, searchParams]);

  return <InitialLoaderScreen text="PULSEFLOW" label="Loading PulseFlow..." />;
}

export default function Page() {
  return (
    <Suspense fallback={<InitialLoaderScreen text="PULSEFLOW" label="Loading PulseFlow..." />}>
      <RootRedirect />
    </Suspense>
  );
}
