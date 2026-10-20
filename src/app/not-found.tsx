import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="smn-page container py-5">
      <div className="smn-panel p-4">
        <h1 className="h3">Accès indisponible / Access unavailable</h1>
        <p>L'accès est refusé ou la page n'existe pas. / Access is denied or this page does not exist.</p>
        <Link href="/" className="btn btn-outline-primary">Accueil / Home</Link>
      </div>
    </main>
  );
}
