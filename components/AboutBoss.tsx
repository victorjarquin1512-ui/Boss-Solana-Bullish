'use client';

import Image from 'next/image';
import { ShieldCheck, Zap, Users } from 'lucide-react';

export default function AboutBoss() {
  return (
    <section id="about" className="relative py-24 bg-black overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#9945FF]/10 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#14F195]/5 blur-[100px] rounded-full -ml-32 -mb-32" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Side: Image Showcase */}
        <div className="relative group">
          {/* Animated glow border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
            <Image 
              src="/boss-throne.jpg" 
              alt="BOSS The Solana Bull on Throne"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Right Side: Mission Content */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-[#14F195] font-mono tracking-[0.2em] uppercase text-sm font-bold">
              The Legend of the Herd
            </h3>
            <h2 className="text-5xl md:text-7xl font-black italic text-white leading-tight tracking-tighter uppercase">
              WHO IS <span className="text-[#9945FF]">$BOSS?</span>
            </h2>
          </div>

          <div className="space-y-6 text-zinc-400 text-lg md:text-xl leading-relaxed">
            <p>
              <span className="text-white font-bold">$BOSS</span> is more than just a ticker; it’s a movement. Standing for <span className="text-[#14F195] font-bold">&quot;Bullish On Solana Season,&quot;</span> we are the official mascots of the most resilient ecosystem in crypto.
            </p>
            <p>
              While others look at charts with fear, the <span className="text-white font-bold">$BOSS</span> sees only opportunity. Our mission is to unite the Solana community under one banner of relentless optimism. To $BOSS, it’s <span className="text-white italic uppercase underline decoration-[#9945FF]">ALWAYS</span> Solana Season.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-4">
              <ShieldCheck className="text-[#14F195]" size={28} />
              <div>
                <p className="text-white font-bold text-sm uppercase">100% Safe</p>
                <p className="text-zinc-500 text-xs italic">LP Burned & Mint Revoked</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-4">
              <Zap className="text-[#9945FF]" size={28} />
              <div>
                <p className="text-white font-bold text-sm uppercase">Solana Native</p>
                <p className="text-zinc-500 text-xs italic">High Speed, Low Fees</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-xl border-l-4 border-[#14F195] text-white italic">
            &quot;$BOSS is here to spread good vibes and become the ultimate ambassador to the Solana ecosystem.&quot;
          </div>
        </div>
      </div>
    </section>
  );
}