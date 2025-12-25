'use client';
import React, { useEffect, useRef, useState } from 'react';

type GameMode = 'EASY' | 'HARD';

export default function BossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [mode, setMode] = useState<GameMode>('EASY');
  const [isMuted, setIsMuted] = useState(false);

  // Refs for Game Engine
  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const bossImgRef = useRef<HTMLImageElement | null>(null);
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  
  // THE FIX: Input Flag
  const jumpRequested = useRef(false);

  // Initialize Assets
  useEffect(() => {
    const img = new Image();
    img.src = '/boss-icon.png';
    img.onload = () => { bossImgRef.current = img; };

    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    bgMusic.current = new Audio('/bg-music.mp3');

    if (bgMusic.current) {
      bgMusic.current.loop = true;
      bgMusic.current.volume = isMuted ? 0 : 0.15;
    }
  }, []);

  // Sync Volume
  useEffect(() => {
    if (bgMusic.current) bgMusic.current.volume = isMuted ? 0 : 0.15;
    if (jumpSound.current) jumpSound.current.volume = isMuted ? 0 : 0.3;
    if (deathSound.current) deathSound.current.volume = isMuted ? 0 : 0.4;
  }, [isMuted]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      bgMusic.current?.play().catch(() => {});
    } else {
      bgMusic.current?.pause();
      if (bgMusic.current) bgMusic.current.currentTime = 0;
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let gridOffset = 0;
    
    const boss = { 
      x: 50, y: 150, width: 42, height: 42, 
      dy: 0, jumpForce: -14.2, gravity: 0.8, grounded: false 
    };

    // --- INPUT HANDLING ---
    const handleInput = (e: Event) => {
      // This stops the "double-fire" surge by killing the event immediately
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      jumpRequested.current = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        jumpRequested.current = true;
      }
    };

    // Attach listeners to canvas for touch/mouse and window for keys
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleInput, { passive: false });
    canvas.addEventListener('mousedown', handleInput);

    const drawBear = (obs: any) => {
      const { x, y, width } = obs;
      const scale = width / 30; 
      ctx.fillStyle = '#4a2b10'; 
      ctx.beginPath(); ctx.arc(x + (5 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (25 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (15 * scale), 15 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d2b48c'; 
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (21 * scale), 7 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x + (8 * scale), y + (10 * scale)); ctx.lineTo(x + (12 * scale), y + (14 * scale));
      ctx.moveTo(x + (22 * scale), y + (10 * scale)); ctx.lineTo(x + (18 * scale), y + (14 * scale));
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(x + (13 * scale), y + (18 * scale), 4 * scale, 2 * scale);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5 * scale;
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (25 * scale), 4 * scale, Math.PI, 0, false); ctx.stroke();
    };

    const update = () => {
      // 1. PROCESS JUMP REQUEST (Limit to 1 jump per frame)
      if (jumpRequested.current) {
        if (boss.grounded) {
          boss.dy = boss.jumpForce;
          boss.grounded = false;
          if (jumpSound.current) {
            jumpSound.current.currentTime = 0;
            jumpSound.current.play().catch(() => {});
          }
        }
        jumpRequested.current = false; // Reset the flag
      }

      // 2. PHYSICS
      const threshold = mode === 'EASY' ? 80 : 40;
      const difficultyScore = Math.max(0, scoreRef.current - threshold);
      const baseSpeed = mode === 'EASY' ? 5.5 : 7.0;
      const currentSpeed = baseSpeed + (Math.sqrt(difficultyScore) * (mode === 'EASY' ? 0.25 : 0.4));
      const currentGravity = 0.8 + (difficultyScore * (mode === 'EASY' ? 0.001 : 0.003));

      boss.dy += currentGravity;
      boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      // 3. OBSTACLES
      const minDistance = mode === 'EASY' ? 285 : 320;
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || (canvas.width - lastObs.x) > minDistance) {
        const type = Math.random() > 0.4 ? 'candle' : 'bear';
        const sizeMult = Math.random() > 0.9 ? 1.2 : 1.0;
        obstaclesRef.current.push({ 
          x: canvas.width, 
          y: canvas.height - (type === 'candle' ? (60 * sizeMult + 20) : (30 * sizeMult + 20)), 
          width: 30 * sizeMult, height: type === 'candle' ? (50 * sizeMult) : (30 * sizeMult), 
          type 
        });
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;
        
        // Precise Hitbox
        if (
          boss.x + 8 < obs.x + obs.width - 6 &&
          boss.x + boss.width - 8 > obs.x + 6 &&
          boss.y + 8 < obs.y + obs.height - 6 &&
          boss.y + boss.height - 8 > obs.y + 6
        ) {
          if (deathSound.current) deathSound.current.play().catch(() => {});
          setGameOver(true);
          return;
        }
        if (obs.x + obs.width < 0) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 1;
          setDisplayScore(scoreRef.current);
        }
      }

      // 4. DRAWING
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      gridOffset = (gridOffset + currentSpeed) % 40;
      ctx.strokeStyle = mode === 'HARD' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(20, 241, 149, 0.1)';
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }
      ctx.strokeStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height - 20); ctx.stroke();
      
      if (bossImgRef.current) {
        ctx.drawImage(bossImgRef.current, boss.x, boss.y, boss.width, boss.height);
      }

      obstaclesRef.current.forEach(obs => {
        if (obs.type === 'candle') {
          ctx.fillStyle = mode === 'HARD' ? '#ff1a1a' : '#ff4d4d';
          const wickH = obs.height * 0.4;
          ctx.fillRect(obs.x + (obs.width / 2) - 1, obs.y - wickH, 2, obs.height + (wickH * 2));
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        } else { drawBear(obs); }
      });
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
    };
  }, [gameStarted, gameOver, mode]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-3xl border border-[#14F195]/20 my-10 max-w-4xl mx-auto backdrop-blur-xl touch-none select-none">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">
          $BOSS <span className={mode === 'HARD' ? 'text-red-500' : 'text-[#14F195]'}>{mode} MODE</span>
        </h2>
      </div>
      
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer" />
        
        <button 
          onPointerDown={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="absolute top-4 right-4 z-[200] px-3 py-1 bg-black/80 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest"
        >
          {isMuted ? "Audio: OFF" : "Audio: ON"}
        </button>

        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[100]">
            <div className="flex gap-4 mb-6 relative z-[110]">
              <button onPointerDown={(e) => { e.stopPropagation(); setMode('EASY'); }} className={`px-6 py-2 rounded-xl font-bold ${mode === 'EASY' ? 'bg-[#14F195] text-black' : 'text-white/40'}`}>EASY</button>
              <button onPointerDown={(e) => { e.stopPropagation(); setMode('HARD'); }} className={`px-6 py-2 rounded-xl font-bold ${mode === 'HARD' ? 'bg-red-600 text-white' : 'text-white/40'}`}>HARD</button>
            </div>
            <button onPointerDown={(e) => { e.stopPropagation(); setGameStarted(true); }} className="px-10 py-4 rounded-xl font-black text-xl bg-[#14F195] text-black">START MISSION</button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[120] text-center">
            <h4 className={`text-5xl font-black italic mb-4 ${mode === 'HARD' ? 'text-red-600' : 'text-white'}`}>REKT</h4>
            <div className="flex gap-4 relative z-[130]">
              <button onPointerDown={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-white text-black px-8 py-3 rounded-lg font-bold">RETRY</button>
              <button onPointerDown={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-zinc-700 text-white px-8 py-3 rounded-lg font-bold">MENU</button>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-xl border border-white/10 z-10 pointer-events-none">
          <span className={`${mode === 'HARD' ? 'text-red-500' : 'text-[#14F195]'} font-mono text-2xl font-bold`}>{displayScore}M</span>
        </div>
      </div>
    </div>
  );
}