"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TrackOrderContent from "./TrackOrderContent";

function TrackOrderContentWithParams() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get("order") || undefined;

  return <TrackOrderContent initialOrderNumber={initialOrderNumber} />;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrackOrderContentWithParams />
    </Suspense>
  );
}
