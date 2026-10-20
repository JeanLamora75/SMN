"use client";
import { useState } from "react";
export default function LogoutControl() {
  const [busy,setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method:"POST",cache:"no-store" });
    } finally {
      // Même sans réseau, ne pas conserver une page privée affichée.
      window.location.assign("/login");
    }
  }
  return <button type="button" className="btn btn-outline-secondary"
    disabled={busy} onClick={()=>{void logout();}}>
    {busy ? "Déconnexion…" : "Se déconnecter"}
  </button>;
}
