import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { browserLanguage } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Scrum Master Notebook",
  description: "Démarrage et diagnostic de l'installation locale SMN",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const lang = await browserLanguage();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
