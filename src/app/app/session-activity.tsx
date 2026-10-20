"use client";
import { useEffect } from "react";
/** Signal d'activité déclenché seulement par une interaction humaine réelle. */
export default function SessionActivity() {
  useEffect(() => {
    let lastSent = Date.now();
    const onActivity = (event: Event) => {
      if (!event.isTrusted || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastSent < 60_000) return;
      lastSent = now;
      void fetch("/api/auth/activity", { method:"POST",cache:"no-store" }).then(r => {
        if (r.status === 401) window.location.assign("/login");
      }).catch(() => undefined);
    };
    document.addEventListener("pointerdown",onActivity);
    document.addEventListener("keydown",onActivity);
    return () => {
      document.removeEventListener("pointerdown",onActivity);
      document.removeEventListener("keydown",onActivity);
    };
  },[]);
  return null;
}
