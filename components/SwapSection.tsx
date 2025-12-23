'use client';

import React, { useEffect } from 'react';

export default function SwapSection() {
  useEffect(() => {
    // Initialize Jupiter Terminal once the script loads
    const initJup = () => {
      if (window.Jupiter) {
        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "integrated-terminal",
          endpoint: "https://api.mainnet-beta.solana.com", // Recommended: Use a private RPC
          formProps: {
            initialOutputMint: "YOUR_SOLANA_CONTRACT_ADDRESS_HERE",
            fixedOutputMint: true,
          },
        });
      }
    };

    if (window.Jupiter) {
      initJup();
    } else {
      document.addEventListener('jupiterTerminalReady', initJup);
    }
  }, []);

  return (
    <section id="swap" className="py-24 bg-zinc-900/30 backdrop-blur-sm">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">GET <span className="text-[#14F195]">$BOSS</span> NOW</h2>
          <p className="text-zinc-500 text-sm mt-2">The fastest way to join the season.</p>
        </div>
        
        {/* The target div for Jupiter */}
        <div id="integrated-terminal" className="min-h-[600px] w-full bg-black rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Script loads here */}
        </div>
      </div>
    </section>
  );
}