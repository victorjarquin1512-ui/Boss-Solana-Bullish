'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  type: 'BEAR' | 'CANDLE';
  x: number; y: number; width: number; height: number; scale: number;
}

interface Planet {
  x: number; y: number; size: number; color: string; speed: number; craters: {cx: number, cy: number, cr: number}[];
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
  const planetsRef = useRef<Planet[]>([]);
  const bossImgRef = useRef<HTMLImageElement | null>(null);
  const solanaLogoRef = useRef<HTMLImageElement | null>(null);
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  
  const jumpRequested = useRef(false);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const step = 1000 / 60;

  const rocket1Ref = useRef({ x: 1100, y: 60 });
  const rocket2Ref = useRef({ x: 1600, y: 170 });
  const solanaLogoXRef = useRef(850);

  useEffect(() => {
    const saved = localStorage.getItem('boss_highscore');
    if (saved) setHighScore(parseInt(saved));
    
    const img = new Image(); img.src = '/boss-icon.png';
    img.onload = () => { bossImgRef.current = img; };
    
    const solLogo = new Image(); 
    solLogo.src = 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png';
    solLogo.onload = () => { solanaLogoRef.current = solLogo; };

    planetsRef.current = Array.from({ length: 5 }, () => ({
      x: Math.random() * 800,
      y: 20 + Math.random() * 140,
      size: 15 + Math.random() * 30,
      color: ['#3a0ca3', '#4361ee', '#7209b7', '#14F195'][Math.floor(Math.random() * 4)],
      speed: 0.05 + Math.random() * 0.2,
      craters: Array.from({length: 3}, () => ({ cx: Math.random()*2 - 1, cy: Math.random()*2 - 1, cr: 0.1 + Math.random()*0.2 }))
    }));
    
    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    bgMusic.current = new Audio('/bg-music.mp3');
    if (bgMusic.current) bgMusic.current.loop = true;

    return () => {
        if (bgMusic.current) {
            bgMusic.current.pause();
            bgMusic.current.src = ""; 
        }
    };
  }, []);

  useEffect(() => {
    if (gameOver && bgMusic.current) {
      bgMusic.current.pause();
      bgMusic.current.currentTime = 0;
    }
  }, [gameOver]);

  useEffect(() => { 
    if (bgMusic.current) {
        bgMusic.current.muted = isMuted;
        bgMusic.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  const handleDeath = () => {
    if (bgMusic.current) {
        bgMusic.current.pause();
        bgMusic.current.currentTime = 0;
    }
    if (deathSound.current && !isMuted) {
      deathSound.current.play().catch(() => {});
    }
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('boss_highscore', scoreRef.current.toString());
    }
    setGameOver(true);
  };

  const startMission = (selectedMode: 'EASY' | 'HARD') => {
    setMode(selectedMode);
    obstaclesRef.current = [];
    scoreRef.current = 0; setScore(0);
    setGameOver(false); setGameStarted(true);
    lastTimeRef.current = performance.now();
    rocket1Ref.current.x = 1100; rocket2Ref.current.x = 1600; solanaLogoXRef.current = 850;
    
    if (bgMusic.current && !isMuted) {
      bgMusic.current.volume = 1;
      bgMusic.current.currentTime = 0;
      bgMusic.current.play().catch(()=>{});
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const boss = { 
      x: 70, 
      y: 200, 
      width: 46, 
      height: 46, 
      dy: 0, 
      jumpForce: mode === 'HARD' ? -15.5 : -15, 
      gravity: mode === 'HARD' ? 0.8 : 0.7, 
      grounded: false 
    };

    let starOffset = 0;

    const drawRocket = (c: CanvasRenderingContext2D, x: number, y: number, pCol: string, sCol: string) => {
        const flicker = Math.random() * 8;
        c.fillStyle = sCol; c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x - 20 - flicker, y + 8); c.lineTo(x, y + 12); c.fill();
        c.fillStyle = '#475569'; c.beginPath(); c.moveTo(x + 5, y); c.lineTo(x - 12, y - 8); c.lineTo(x + 18, y); c.fill(); 
        c.beginPath(); c.moveTo(x + 5, y + 16); c.lineTo(x - 12, y + 24); c.lineTo(x + 18, y + 16); c.fill();
        c.fillStyle = pCol; c.beginPath(); (c as any).roundRect(x, y, 48, 16, 4); c.fill();
        c.fillStyle = '#cbd5e1'; c.beginPath(); c.moveTo(x + 48, y); c.quadraticCurveTo(x + 62, y + 8, x + 48, y + 16); c.fill();
    };

    const drawBear = (c: CanvasRenderingContext2D, obs: Obstacle) => {
        const { x, y, width, height, scale } = obs;
        const walk = Math.sin(Date.now() * 0.015) * 10;
        const angerPulse = Math.abs(Math.sin(Date.now() * 0.01)) * 5;

        c.save();
        c.translate(x + (width * scale) / 2, y + (height * scale));
        c.scale(scale, scale);
        c.translate(-width / 2, -height);

        // LEGS & FEET
        c.fillStyle = '#1a0d04';
        c.fillRect(6, height - 18 + walk, 14, 18); // Left Leg
        c.fillRect(width - 20, height - 18 - walk, 14, 18); // Right Leg
        
        // CLAWS ON FEET
        c.fillStyle = '#ffffff';
        for(let i=0; i<3; i++) {
            c.fillRect(6 + (i*5), height - 2 + walk, 2, 5);
            c.fillRect(width - 20 + (i*5), height - 2 - walk, 2, 5);
        }

        // TORSO
        c.fillStyle = '#2d1a0e';
        c.beginPath();
        c.moveTo(2, 30);
        c.quadraticCurveTo(width/2, 0, width-2, 30);
        c.lineTo(width+4, height - 12);
        c.lineTo(-4, height - 12);
        c.fill();

        // SHARP ARMS WITH CLAWS
        c.strokeStyle = '#1a0d04';
        c.lineWidth = 9;
        c.lineCap = 'round';
        // Left Arm
        c.beginPath(); c.moveTo(8, 35); c.lineTo(-12, 45 + walk); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(-15, 43 + walk, 6, 2); c.fillRect(-15, 47 + walk, 6, 2);
        // Right Arm
        c.beginPath(); c.moveTo(width - 8, 35); c.lineTo(width + 12, 45 - walk); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(width + 10, 43 - walk, 6, 2); c.fillRect(width + 10, 47 - walk, 6, 2);

        // HEAD
        c.fillStyle = '#2d1a0e';
        c.beginPath(); c.arc(width/2 - 12, 8, 7, 0, Math.PI * 2); c.fill(); // Left Ear
        c.beginPath(); c.arc(width/2 + 12, 8, 7, 0, Math.PI * 2); c.fill(); // Right Ear
        c.beginPath(); c.arc(width/2, 20, 18, 0, Math.PI * 2); c.fill(); // Main Head

        // MEAN FACE
        // Glow effect for eyes
        ctx.shadowBlur = angerPulse;
        ctx.shadowColor = 'red';
        c.fillStyle = '#ff0000';
        // Slanted Angry Eyebrows
        c.strokeStyle = '#000'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(width/2 - 12, 12); c.lineTo(width/2 - 4, 16); c.stroke();
        c.beginPath(); c.moveTo(width/2 + 12, 12); c.lineTo(width/2 + 4, 16); c.stroke();
        // Eyes
        c.fillRect(width/2 - 10, 16, 5, 3);
        c.fillRect(width/2 + 5, 16, 5, 3);
        ctx.shadowBlur = 0;

        // Snout & Mouth
        c.fillStyle = '#1a0d04';
        c.beginPath(); c.ellipse(width/2, 28, 10, 8, 0, 0, Math.PI * 2); c.fill();
        // Gaping Mouth
        c.fillStyle = '#000';
        c.beginPath(); c.arc(width/2, 31, 4, 0, Math.PI); c.fill();
        // Teeth
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(width/2-3, 31); c.lineTo(width/2-2, 34); c.lineTo(width/2-1, 31); c.fill();
        c.beginPath(); c.moveTo(width/2+1, 31); c.lineTo(width/2+2, 34); c.lineTo(width/2+3, 31); c.fill();

        c.restore();
    };

    const update = () => {
      if (jumpRequested.current && boss.grounded) {
        boss.dy = boss.jumpForce; boss.grounded = false; jumpRequested.current = false;
        if (jumpSound.current && !isMuted) { jumpSound.current.currentTime = 0; jumpSound.current.play().catch(()=>{}); }
      }
      boss.dy += boss.gravity; boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 25) { boss.y = canvas.height - 25 - boss.height; boss.dy = 0; boss.grounded = true; }

      const baseSpeed = mode === 'EASY' ? 6.2 : 8.5;
      const speedScale = mode === 'HARD' ? 0.04 : 0.035;
      const speed = baseSpeed + (scoreRef.current * speedScale);
      
      starOffset -= speed * 0.2; 
      solanaLogoXRef.current -= speed * 0.15;
      rocket1Ref.current.x -= speed * 2.2;
      rocket2Ref.current.x -= speed * 1.8;

      if (rocket1Ref.current.x < -200) rocket1Ref.current.x = canvas.width + 1200;
      if (rocket2Ref.current.x < -200) rocket2Ref.current.x = canvas.width + 1800;
      if (solanaLogoXRef.current < -300) solanaLogoXRef.current = canvas.width + 1000;

      planetsRef.current.forEach(p => {
        p.x -= speed * p.speed;
        if (p.x + p.size * 2 < 0) { p.x = canvas.width + 200; p.y = 20 + Math.random() * 140; }
      });

      const minGap = mode === 'HARD' ? 360 : 380;
      if (obstaclesRef.current.length === 0 || (canvas.width - obstaclesRef.current[obstaclesRef.current.length - 1].x) > minGap) {
          if (Math.random() > 0.5) {
            obstaclesRef.current.push({ type: 'BEAR', x: canvas.width, y: canvas.height - 110, width: 60, height: 85, scale: 0.6 + Math.random() * 0.7 });
          } else {
            const vH = 35 + Math.random() * 75; const vW = 16 + Math.random() * 14;
            obstaclesRef.current.push({ type: 'CANDLE', x: canvas.width, y: canvas.height - 25 - vH, width: vW, height: vH, scale: 1 });
          }
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i]; obs.x -= speed;
        const vW = obs.width * obs.scale, vH = obs.height * obs.scale;
        const padding = mode === 'HARD' ? 12 : 14;

        if (boss.x + padding < obs.x + vW && boss.x + boss.width - padding > obs.x && boss.y + 10 < obs.y + vH && boss.y + boss.height - 10 > obs.y) {
          handleDeath(); return;
        }
        if (obs.x + vW < 0) { obstaclesRef.current.splice(i, 1); scoreRef.current++; setScore(scoreRef.current); }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#020012'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (solanaLogoRef.current) { ctx.save(); ctx.globalAlpha = 0.12; ctx.drawImage(solanaLogoRef.current, solanaLogoXRef.current, 60, 220, 180); ctx.restore(); }
      
      planetsRef.current.forEach(p => {
          ctx.save(); ctx.translate(p.x, p.y);
          const grad = ctx.createRadialGradient(0, 0, p.size * 0.8, 0, 0, p.size * 1.2);
          grad.addColorStop(0, p.color); grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, p.size * 1.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; p.craters.forEach(crater => { ctx.beginPath(); ctx.arc(crater.cx * p.size, crater.cy * p.size, crater.cr * p.size, 0, Math.PI * 2); ctx.fill(); });
          ctx.restore();
      });

      drawRocket(ctx, rocket1Ref.current.x, rocket1Ref.current.y, '#94a3b8', '#14F195');
      drawRocket(ctx, rocket2Ref.current.x, rocket2Ref.current.y, '#64748b', '#9945FF');

      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 20; i++) { ctx.fillRect((i * 180 + starOffset) % canvas.width, (i * 90) % canvas.height, 2, 2); }
      
      const volatility = Math.min(scoreRef.current / 100, 1);
      const floorColor = `rgb(${20 + volatility * 235}, ${241 - volatility * 200}, ${149 - volatility * 100})`;
      ctx.shadowBlur = 10 + volatility * 20; ctx.shadowColor = floorColor; ctx.strokeStyle = floorColor; 
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, canvas.height - 25); ctx.lineTo(canvas.width, canvas.height - 25); ctx.stroke(); ctx.shadowBlur = 0;

      if (bossImgRef.current) ctx.drawImage(bossImgRef.current, boss.x, boss.y, boss.width, boss.height);
      obstaclesRef.current.forEach(obs => { 
        if (obs.type === 'BEAR') drawBear(ctx, obs); 
        else { 
          ctx.fillStyle = '#ff4d4d'; ctx.shadowBlur = 15; ctx.shadowColor = 'red'; 
          ctx.fillRect(obs.x, obs.y + 5, obs.width, obs.height - 5); 
          ctx.fillRect(obs.x + obs.width/2 - 1, obs.y - 10, 2, obs.height + 20); 
          ctx.shadowBlur = 0; 
        } 
      });
    };

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current; lastTimeRef.current = time; accumulatorRef.current += delta;
      while (accumulatorRef.current >= step) { update(); accumulatorRef.current -= step; }
      draw(); 
      if (!gameOver) requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => { 
        if (e.code === 'Space') { e.preventDefault(); jumpRequested.current = true; } 
    };
    const handlePointerDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        jumpRequested.current = true;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    
    return () => {
      cancelAnimationFrame(requestRef.current!);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gameStarted, gameOver, isMuted, mode, highScore]);

  return (
    <div className="relative w-full max-w-4xl aspect-[21/9] bg-black rounded-3xl border-2 border-[#14F195]/20 overflow-hidden mx-auto shadow-2xl">
      <canvas ref={canvasRef} width={800} height={340} className="w-full h-full" />
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 pointer-events-none">
        <div className="flex flex-col font-black italic">
          <span className="text-[#14F195] text-3xl drop-shadow-md">{score} LY</span>
          <span className="text-white/40 text-xs uppercase">High: {highScore}</span>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="pointer-events-auto bg-black/60 p-2 rounded-full border border-white/10 hover:bg-white/10">
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {!gameStarted && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-40">
          <h2 className="text-[#14F195] text-8xl font-black italic mb-8 uppercase tracking-tighter">$BOSS</h2>
          <div className="flex gap-4">
            <button onClick={() => startMission('EASY')} className="px-10 py-3 border-2 border-[#14F195] text-[#14F195] font-bold rounded-full hover:bg-[#14F195] hover:text-black transition-colors">EASY</button>
            <button onClick={() => startMission('HARD')} className="px-10 py-3 border-2 border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition-colors">HARD</button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <h2 className="text-white text-7xl font-black italic mb-2 uppercase">Rekt</h2>
          <div className="flex gap-4">
            <button onClick={() => startMission('EASY')} className="px-10 py-3 bg-white text-black font-black rounded-full uppercase hover:bg-[#14F195] transition-colors">Easy</button>
            <button onClick={() => startMission('HARD')} className="px-10 py-3 bg-transparent border-2 border-white text-white font-black rounded-full uppercase hover:bg-red-600 transition-colors">Hard</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-black mb-12 text-white italic tracking-tighter uppercase">$BOSS RUNNER</h1>
        <BossGame />
    </main>
  );
}