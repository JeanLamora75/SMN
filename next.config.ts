import type { NextConfig } from "next";

// Le poste Windows du pilote utilise pnpm sans autorisation de créer des
// liens symboliques. Le build classique y suffit pour "pnpm start".
// Le packaging autonome demande explicitement le mode standalone.
export function standaloneOutputFor(
  platform: NodeJS.Platform,
  requestedByPackaging: boolean,
): "standalone" | undefined {
  return platform !== "win32" || requestedByPackaging ? "standalone" : undefined;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: standaloneOutputFor(
    process.platform,
    process.env.SMN_BUILD_STANDALONE === "1",
  ),
};

export default nextConfig;
