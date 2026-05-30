"use client";

import { useParams } from "next/navigation";
import TrackOrderContent from "../TrackOrderContent";

export default function TrackOrderByNumberPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = typeof params?.orderNumber === "string" ? params.orderNumber : undefined;

  return <TrackOrderContent initialOrderNumber={orderNumber} />;
}
