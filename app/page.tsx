"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RootRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/tasks?${qs}` : "/tasks");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-[var(--app-accent)] font-semibold text-sm">
      Loading PulseFlow...
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-[var(--app-accent)] font-semibold text-sm">
          Loading PulseFlow...
        </div>
      }
    >
      <RootRedirect />
    </Suspense>
  );
}
