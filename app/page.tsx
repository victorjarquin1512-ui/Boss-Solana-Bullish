'use client';
import React from 'react';
import AboutBoss from '@/components/AboutBoss';
import BossGallery from '@/components/BossGallery';
import BossGame from '@/components/BossGame';
import CommunityCTA from '@/components/CommunityCTA';
import Roadmap from '@/components/Roadmap';
import SwapSection from '@/components/SwapSection';

export default function MainPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#14F195] selection:text-black font-sans">
      
      {/* STICKY NAVIGATION */}
      <nav className="fixed top-0 w-full z-[100] px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-black italic tracking-tighter cursor-pointer hover:text-[#14F195] transition-colors">
            $BOSS
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex gap-6 font-mono text-xs uppercase tracking-[0.2em]">
              <a href="#mission" className="hover:text-[#14F195] transition-colors">Mission</a>
              <a href="#gallery" className="hover:text-[#14F195] transition-colors">Archive</a>
            </div>
            <a href="https://raydium.io" target="_blank" className="bg-[#14F195] text-black px-5 py-2 rounded-full font-black text-sm hover:scale-105 transition-transform uppercase italic">
              Buy Now
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH VIDEO */}
      <section className="relative h-[90vh] md:h-screen w-full flex flex-col items-center justify-center text-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-60">
          <source src="/boss-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-transparent to-black z-10" />
        <div className="relative z-20 px-6 mt-20">
          <h1 className="text-7xl md:text-[13rem] font-black italic tracking-tighter leading-none mb-4 uppercase drop-shadow-2xl">
            $BOSS
          </h1>
          <p className="text-[#14F195] font-mono text-xl md:text-2xl tracking-[0.4em] uppercase italic mb-10">
            Solana Bull Spirit
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <a href="#swap" className="px-10 py-4 bg-white text-black font-black rounded-2xl text-xl hover:bg-[#14F195] transition-all hover:scale-105 uppercase italic">
              Buy $BOSS
            </a>
            <a href="https://t.me/Boss_Solana_Bull_Official" target="_blank" className="px-10 py-4 bg-white/5 border border-white/20 backdrop-blur-sm rounded-2xl text-xl font-black hover:bg-white/10 transition-all uppercase italic">
              Telegram
            </a>
          </div>
        </div>
      </section>

      {/* MISSION / GAME SECTION */}
      <section id="mission" className="py-20 px-6 max-w-7xl mx-auto relative z-30">
        <BossGame />
      </section>

      {/* MODULAR CONTENT */}
      <div className="relative z-30">
        <AboutBoss />
        <section id="swap"><SwapSection /></section>
        <BossGallery />
        <Roadmap />
        <CommunityCTA />
      </div>

      <footer className="py-20 border-t border-white/10 text-center relative z-30">
        <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.5em] italic">
          © 2025 BOSS BULL MISSION • POWERED BY SOLANA
        </p>
      </footer>
    </main>
  );
}