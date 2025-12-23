import AboutBoss from '@/components/AboutBoss';
import Roadmap from '@/components/Roadmap';
import BossGallery from '@/components/BossGallery';
import CommunityCTA from '@/components/CommunityCTA';
import SwapSection from '@/components/SwapSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-black scroll-smooth overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video - Fixed Zoom and Positioning */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[center_15%] opacity-60 z-0"
        >
          <source src="/boss-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay Gradient - Ensures text pops regardless of video brightness */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black z-[1]" />

        {/* Hero Text */}
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <h1 className="text-7xl md:text-[12rem] font-black italic text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(20,241,149,0.4)] transition-transform duration-700 hover:scale-[1.02]">
            $BOSS
          </h1>
          <p className="text-xl md:text-4xl text-[#14F195] font-black mt-4 tracking-[0.2em] uppercase italic drop-shadow-lg">
            Bullish On Solana Season
          </p>
          
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            <a 
              href="#swap" 
              className="bg-[#14F195] text-black px-10 py-4 rounded-2xl font-black text-xl hover:bg-white transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(20,241,149,0.4)]"
            >
              BUY $BOSS
            </a>
            <a 
              href="#about" 
              className="bg-white/5 backdrop-blur-xl text-white border border-white/20 px-10 py-4 rounded-2xl font-black text-xl hover:bg-white/20 transition-all transform hover:scale-105"
            >
              EXPLORE
            </a>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-50">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#14F195] to-transparent" />
        </div>
      </section>

      {/* 2. Mission & Story */}
      <section id="about">
        <AboutBoss />
      </section>

      {/* 3. The Utility (Jupiter Swap) */}
      <section id="swap">
        <SwapSection />
      </section>

      {/* 4. The Vision (Roadmap) */}
      <Roadmap />

      {/* 5. The Culture (Gallery) */}
      <BossGallery />

      {/* 6. The Herd (Join Community) */}
      <CommunityCTA />

      {/* 7. Footer Disclaimer */}
      <footer className="py-12 bg-black text-center border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-zinc-600 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase leading-relaxed">
            $BOSS is a memecoin with no intrinsic value. Invest only what you can afford to lose. 
            The Bull never sleeps, but he is not financial advice. 
            Built on Solana.
          </p>
          <p className="mt-4 text-zinc-800 text-[10px] font-mono">© 2025 BULLISH ON SOLANA SEASON</p>
        </div>
      </footer>
    </main>
  );
}