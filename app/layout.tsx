import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // --- Browser Tab & SEO ---
  title: "$BOSS | Bullish On Solana Season",
  description: "The Official Solana Bull. Relentlessly bullish on the Solana Ecosystem. Join the herd and lead the season.",
  
  // --- X (Twitter) & Social Previews ---
  openGraph: {
    title: "$BOSS | Bullish On Solana Season",
    description: "Always Bullish. Always Solana. Join the $BOSS herd.",
    url: "https://your-boss-site.vercel.app", // Update this when you have your Vercel URL
    siteName: "$BOSS Solana",
    images: [{ url: "/boss-cyber.jpg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$BOSS | Bullish On Solana Season",
    description: "Always Bullish. Always Solana. Join $BOSS.",
    images: ["/boss-cyber.jpg"],
    creator: "@SolanaBullBoss", // Your updated handle
    site: "@SolanaBullBoss",    // Your updated handle
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}

        {/* Jupiter Terminal Script - Vital for SwapSection.tsx */}
        <Script 
          src="https://terminal.jup.ag/main-v3.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}