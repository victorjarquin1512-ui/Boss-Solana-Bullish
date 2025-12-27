'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  type: 'BEAR' | 'CANDLE';
  x: number;
  y: number;
  width: number;
  height: number;
  isStanding?: boolean;
}

function BossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [mode, setMode] = useState<'EASY' | 'HARD'>('EASY');
  const [isMuted, setIsMuted] = useState(false);

  const scoreRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const bossImgRef = useRef<HTMLImageElement | null>(null);
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const jumpRequested = useRef(false);
  const requestRef = useRef<number | null>(null);
  
  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const step = 1000 / 60;

  useEffect(() => {
    const saved = localStorage.getItem('boss_highscore');
    if (saved) setHighScore(parseInt(saved));
    const img = new Image();
    img.src = '/boss-icon.png';
    img.onload = () => { bossImgRef.current = img; };
    
    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    bgMusic.current = new Audio('/bg-music.mp3');
    
    if (bgMusic.current) {
      bgMusic.current.loop = true;
      bgMusic.current.volume = 1.0; 
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); 
        if (!gameStarted) return;
        jumpRequested.current = true; 
      }
    };
    const handlePointer = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (!gameStarted) return;
      jumpRequested.current = true;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointer);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointer);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (bgMusic.current) {
      bgMusic.current.muted = isMuted;
    }
  }, [isMuted]);

  const triggerVibrate = (pattern: VibratePattern) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const startMission = (selectedMode: 'EASY' | 'HARD') => {
    setMode(selectedMode);
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    lastTimeRef.current = performance.now();
    triggerVibrate(50);

    if (bgMusic.current && !isMuted) {
      bgMusic.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const boss = { x: 50, y: 150, width: 44, height: 44, dy: 0, jumpForce: -15.5, gravity: 0.82, grounded: false };
    let starOffset = 0, planetX = 850, rocket1X = 1000, rocket2X = 1600;

    const drawRealisticRocket = (c: CanvasRenderingContext2D, x: number, y: number, pCol: string, sCol: string) => {
        const flicker = Math.random() * 8;
        const gradient = c.createLinearGradient(x - 40, y, x, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, sCol);
        gradient.addColorStop(1, 'white');
        c.fillStyle = gradient;
        c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x - 30 - flicker, y + 8); c.lineTo(x, y + 14); c.fill();
        c.fillStyle = pCol;
        c.beginPath(); (c as any).roundRect(x, y, 60, 16, 8); c.fill();
        c.fillStyle = '#1e293b';
        c.beginPath(); c.ellipse(x + 45, y + 8, 8, 4, 0, 0, Math.PI * 2); c.fill();
    };

    // RESTORED: Claw Drawing Logic
    const drawClaws = (c: CanvasRenderingContext2D, x: number, y: number) => {
        c.strokeStyle = '#e0e0e0'; c.lineWidth = 1.5;
        for (let i = -3; i <= 3; i += 3) {
            c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y + 6); c.stroke();
        }
    };

    const drawBear = (c: CanvasRenderingContext2D, obs: Obstacle) => {
        const { x, y, width, height, isStanding } = obs;
        c.fillStyle = '#2d1a0a';
        const walkCycle = Math.sin(Date.now() * 0.01) * 5;
        
        // Body & Legs
        if (isStanding) {
            c.beginPath(); (c as any).roundRect(x + 5, y + 15, width - 10, height - 15, 10); c.fill();
            c.beginPath(); c.arc(x + width / 2, y + 15, 15, 0, Math.PI * 2); c.fill(); // Head
            c.fillRect(x - 2, y + 20 + walkCycle, 8, 15); // Left Leg
            c.fillRect(x + width - 6, y + 20 - walkCycle, 8, 15); // Right Leg
            drawClaws(c, x + 2, y + 35 + walkCycle);
            drawClaws(c, x + width - 2, y + 35 - walkCycle);
        } else {
            c.beginPath(); (c as any).roundRect(x, y + 12, width - 10, height - 12, 10); c.fill();
            c.beginPath(); c.arc(x + width - 15, y + 15, 14, 0, Math.PI * 2); c.fill(); // Head
            c.fillRect(x + 5, y + 25 + walkCycle, 8, 12);
            c.fillRect(x + width - 25, y + 25 - walkCycle, 8, 12);
            drawClaws(c, x + 9, y + 35 + walkCycle);
            drawClaws(c, x + width - 21, y + 35 - walkCycle);
        }

        // RESTORED: Angry Face (Eyes & Nose)
        const headX = isStanding ? x + width/2 : x + width - 15;
        const headY = 12 + y;
        c.fillStyle = 'red'; // Angry Glowing Eyes
        c.fillRect(headX - 8, headY, 4, 3); 
        c.fillRect(headX + 4, headY, 4, 3);
        c.fillStyle = '#1a0d04'; // Nose
        c.beginPath(); c.arc(headX, headY + 8, 4, 0, Math.PI * 2); c.fill();
        
        // Ears
        c.fillStyle = '#2d1a0a';
        if (isStanding) {
            c.beginPath(); c.arc(x + 10, y + 5, 6, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(x + width - 10, y + 5, 6, 0, Math.PI * 2); c.fill();
        } else {
            c.beginPath(); c.arc(x + width - 22, y + 5, 5, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(x + width - 8, y + 5, 5, 0, Math.PI * 2); c.fill();
        }
    };

    const update = () => {
      if (jumpRequested.current && boss.grounded) {
        boss.dy = boss.jumpForce; boss.grounded = false;
        if (jumpSound.current && !isMuted) { jumpSound.current.currentTime = 0; jumpSound.current.play(); }
        jumpRequested.current = false;
      }
      boss.dy += boss.gravity; boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) { 
        boss.y = canvas.height - 20 - boss.height; boss.dy = 0; boss.grounded = true; jumpRequested.current = false; 
      }

      const speed = (mode === 'EASY' ? 6 : 8.5) + (scoreRef.current * 0.05);
      starOffset -= speed * 0.2; planetX -= speed * 0.1; 
      rocket1X -= speed * 2.5; rocket2X -= speed * 1.8;

      if (planetX < -200) planetX = canvas.width + 400;
      if (rocket1X < -200) rocket1X = canvas.width + 900;
      if (rocket2X < -200) rocket2X = canvas.width + 1300;

      if (obstaclesRef.current.length === 0 || (canvas.width - obstaclesRef.current[obstaclesRef.current.length - 1].x) > 380) {
        if (Math.random() > 0.45) {
          const isStanding = Math.random() > 0.5;
          obstaclesRef.current.push({ type: 'BEAR', x: canvas.width, y: canvas.height - (isStanding ? 85 : 55), width: isStanding ? 45 : 70, height: isStanding ? 65 : 40, isStanding });
        } else {
          const candleHeight = 45 + Math.random() * 45; 
          obstaclesRef.current.push({ type: 'CANDLE', x: canvas.width, y: canvas.height - 20 - candleHeight, width: 22, height: candleHeight });
        }
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i]; obs.x -= speed;
        if (boss.x < obs.x + obs.width && boss.x + boss.width > obs.x && boss.y < obs.y + obs.height && boss.y + boss.height > obs.y) {
          triggerVibrate([100, 50, 100]);
          if (deathSound.current && !isMuted) deathSound.current.play();
          if (scoreRef.current > highScore) { setHighScore(scoreRef.current); localStorage.setItem('boss_highscore', scoreRef.current.toString()); }
          setGameOver(true); return;
        }
        if (obs.x + obs.width < 0) { obstaclesRef.current.splice(i, 1); scoreRef.current++; setScore(scoreRef.current); }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#020012'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      for (let i = 0; i < 25; i++) { ctx.fillRect((i * 180 + starOffset) % canvas.width, (i * 90) % canvas.height, 2, 2); }
      drawRealisticRocket(ctx, rocket1X, 60, '#cbd5e1', '#14F195');
      drawRealisticRocket(ctx, rocket2X, 150, '#475569', '#9945FF');
      ctx.fillStyle = '#3a0ca3'; ctx.beginPath(); ctx.arc(planetX, 80, 40, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#4361ee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(planetX, 80, 75, 15, Math.PI/6, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#14F195'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height - 20); ctx.stroke();
      if (bossImgRef.current) ctx.drawImage(bossImgRef.current, boss.x, boss.y, boss.width, boss.height);
      obstaclesRef.current.forEach(obs => {
        if (obs.type === 'BEAR') drawBear(ctx, obs);
        else {
          ctx.fillStyle = '#ff4d4d'; ctx.shadowBlur = 10; ctx.shadowColor = 'red';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillRect(obs.x + obs.width/2 - 1, obs.y - 12, 2, obs.height + 24);
          ctx.shadowBlur = 0;
        }
      });
    };

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current; lastTimeRef.current = time; accumulatorRef.current += delta;
      while (accumulatorRef.current >= step) { update(); accumulatorRef.current -= step; }
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameStarted, gameOver, mode, isMuted, highScore]);

  return (
    <div className="relative w-full max-w-4xl aspect-[21/9] bg-black rounded-3xl border-2 border-[#14F195]/20 overflow-hidden mx-auto shadow-2xl">
      <canvas ref={canvasRef} width={800} height={340} className="w-full h-full" />
      <div className="absolute top-4 left-6 right-6 flex justify-between items-start z-30 pointer-events-none text-white font-black">
        <div className="font-mono text-2xl text-[#14F195] uppercase drop-shadow-md">{score} LY</div>
        <button onClick={() => setIsMuted(!isMuted)} className="pointer-events-auto bg-black/60 p-2 rounded-lg border border-white/10 active:scale-90 transition-transform">
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {!gameStarted && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-40 p-6 text-center">
          <h2 className="text-[#14F195] text-6xl md:text-8xl font-black italic mb-6 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(20,241,149,0.4)]">$BOSS</h2>
          <div className="flex gap-4 mb-4">
            <button onClick={() => startMission('EASY')} className="px-10 py-3 rounded-full font-bold border-2 border-[#14F195] text-[#14F195] active:bg-[#14F195] active:text-black transition-all">EASY</button>
            <button onClick={() => startMission('HARD')} className="px-10 py-3 rounded-full font-bold border-2 border-red-600 text-red-600 active:bg-red-600 active:text-white transition-all">HARD</button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
          <h2 className="text-white text-6xl md:text-8xl font-black italic mb-2 uppercase drop-shadow-lg">REKT</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => startMission('EASY')} className="px-12 py-3 bg-white text-black font-black rounded-full uppercase active:scale-95 transition-transform hover:bg-[#14F195]">Easy Retry</button>
            <button onClick={() => startMission('HARD')} className="px-12 py-3 bg-black text-white font-black border-2 border-white rounded-full uppercase active:scale-95 transition-transform hover:bg-red-600 hover:border-red-600">Hard Retry</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#020202] text-white p-6">
      <div className="max-w-6xl mx-auto text-center py-10">
        <h1 className="text-8xl md:text-9xl font-black italic mb-2 tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">$BOSS</h1>
        <p className="text-[#14F195] font-mono tracking-[0.4em] mb-12 uppercase text-sm font-bold opacity-80">Official Solana Bull Spirit</p>
        <div className="mt-16 mb-8">
            <h2 className="text-4xl font-black text-white italic tracking-tight uppercase">Boss Runner Game</h2>
            <div className="h-1 w-24 bg-[#14F195] mx-auto mt-2 rounded-full shadow-[0_0_10px_#14F195]"></div>
        </div>
        <BossGame />
      </div>
    </main>
  );
}