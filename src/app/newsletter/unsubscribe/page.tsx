"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

function NewsletterUnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Désinscription en cours...");

  useEffect(() => {
    const token = searchParams.get("token") || "";
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide.");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/newsletter/unsubscribe?token=${token}`);
        if (!response.ok) {
          throw new Error("unsubscribe");
        }
        setStatus("success");
        setMessage("Vous êtes désinscrit(e).");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Impossible de traiter la désinscription.");
      }
    };

    void unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-4">
        {status === "success" ? (
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
        ) : status === "error" ? (
          <XCircle className="w-14 h-14 text-red-500 mx-auto" />
        ) : null}
        <h1 className="text-2xl font-semibold">Newsletter</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <NewsletterUnsubscribeContent />
    </Suspense>
  );
}
