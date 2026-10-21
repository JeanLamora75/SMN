"use client";
import { useState } from "react";
import {useTranslation} from "@/i18n/client";
export default function LogoutControl() {
  const t=useTranslation();
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
  return <button type="button" data-smn-navigation-action="logout" className="btn btn-outline-secondary"
    disabled={busy} onClick={()=>{void logout();}}>
    {t(busy?"session.loggingOut":"session.logout")}
  </button>;
}
