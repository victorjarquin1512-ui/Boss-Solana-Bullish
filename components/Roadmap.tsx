'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const phases = [
  {
    title: "Phase 1: Launch & Community",
    mcap: "$0 - $100k",
    status: "active",
    items: [
      "Token stealth launch on Solana",
      "Burning 100% of Liquidity",
      "Building 'The Herd' community",
      "DexScreener & Birdeye trending"
    ]
  },
  {
    title: "Phase 2: Viral Acceleration",
    mcap: "$100k - $1M",
    status: "upcoming",
    items: [
      "KOL (Influencer) partnerships",
      "Global meme competitions",
      "CoinGecko & CoinMarketCap listings",
      "Aggressive X (Twitter) raids"
    ]
  },
  {
    title: "Phase 3: Ecosystem Domination",
    mcap: "$1M - $10M",
    status: "upcoming",
    items: [
      "Official $BOSS Merch Store",
      "Exclusive NFT 'Bull Pass' drop",
      "Strategic Solana ecosystem collabs",
      "Major CEX listing push"
    ]
  },
  {
    title: "Phase 4: To The Moon",
    mcap: "$10M+",
    status: "upcoming",
    items: [
      "Global Bullish billboard campaign",
      "Charity initiatives for wildlife",
      "Becoming the #1 mascot of Solana",
      "Always Solana Season Celebration"
    ]
  }
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-24 bg-black relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#14F195]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase mb-4">
            THE <span className="text-[#14F195]">BULLISH</span> PATH
          </h2>
          <p className="text-zinc-500 font-mono tracking-widest uppercase">Our Mission Milestones</p>
        </div>

        {/* Responsive Grid System: 1 column on mobile, 2 on tablets, 4 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((phase, index) => (
            <div key={index} className="relative group">
              {/* Card Container */}
              <div className={`h-full p-8 rounded-2xl border transition-all duration-500 flex flex-col ${
                phase.status === 'active' 
                  ? 'bg-zinc-900/50 border-[#14F195] shadow-[0_0_30px_rgba(20,241,149,0.15)] scale-[1.02]' 
                  : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-600'
              }`}>
                
                {/* Status Indicator */}
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded border ${
                    phase.status === 'active' 
                      ? 'text-[#14F195] border-[#14F195]/30 bg-[#14F195]/10' 
                      : 'text-zinc-500 border-zinc-800 bg-zinc-900'
                  }`}>
                    {phase.mcap}
                  </span>
                  {phase.status === 'active' ? (
                    <div className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14F195]"></span>
                    </div>
                  ) : null}
                </div>

                <h3 className="text-xl font-black italic text-white uppercase mb-6 leading-tight">
                  {phase.title}
                </h3>
                
                <ul className="space-y-4 flex-grow">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                      {phase.status === 'active' ? (
                        <CheckCircle2 size={16} className="text-[#14F195] mt-0.5 shrink-0" />
                      ) : (
                        <Circle size={16} className="text-zinc-800 mt-0.5 shrink-0" />
                      )}
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom decorative bar for Phase 1 */}
                {phase.status === 'active' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-[#14F195] blur-[4px]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}