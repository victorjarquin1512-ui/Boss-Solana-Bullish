'use client';
import React, { useEffect, useRef, useState } from 'react';

type GameMode = 'EASY' | 'HARD';

export default function BossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [mode, setMode] = useState<GameMode>('EASY');
  const [isMuted, setIsMuted] = useState(false);

  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const bossImgRef = useRef<HTMLImageElement | null>(null);
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  
  // THE THROTTLE FIX
  const lastJumpTime = useRef(0);
  const jumpRequested = useRef(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/boss-icon.png';
    img.onload = () => { bossImgRef.current = img; };
    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    bgMusic.current = new Audio('/bg-music.mp3');
    if (bgMusic.current) bgMusic.current.loop = true;
  }, []);

  useEffect(() => {
    if (bgMusic.current) bgMusic.current.volume = isMuted ? 0 : 0.15;
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

    const handleInput = (e: any) => {
      // 1. Block all default browser behavior
      if (e.cancelable) e.preventDefault();
      
      // 2. Throttle: Only allow one jump signal every 150ms
      const now = Date.now();
      if (now - lastJumpTime.current > 150) {
        jumpRequested.current = true;
        lastJumpTime.current = now;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jumpRequested.current = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleInput, { passive: false });
    canvas.addEventListener('mousedown', handleInput);

    const update = () => {
      if (jumpRequested.current) {
        if (boss.grounded) {
          boss.dy = boss.jumpForce;
          boss.grounded = false;
          if (jumpSound.current) {
            jumpSound.current.currentTime = 0;
            jumpSound.current.play().catch(() => {});
          }
        }
        jumpRequested.current = false;
      }

      const threshold = mode === 'EASY' ? 80 : 40;
      const difficultyScore = Math.max(0, scoreRef.current - threshold);
      const baseSpeed = mode === 'EASY' ? 5.5 : 7.0;
      const currentSpeed = baseSpeed + (Math.sqrt(difficultyScore) * (mode === 'EASY' ? 0.25 : 0.4));
      
      boss.dy += 0.8;
      boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      const minDistance = mode === 'EASY' ? 285 : 320;
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || (canvas.width - lastObs.x) > minDistance) {
        obstaclesRef.current.push({ 
          x: canvas.width, 
          y: canvas.height - 50, 
          width: 30, height: 30, 
          type: 'candle' 
        });
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;
        if (boss.x < obs.x + obs.width && boss.x + boss.width > obs.x && boss.y < obs.y + obs.height && boss.y + boss.height > obs.y) {
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      gridOffset = (gridOffset + currentSpeed) % 40;
      ctx.strokeStyle = 'rgba(20, 241, 149, 0.1)';
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }
      ctx.strokeStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
      ctx.strokeRect(0, canvas.height - 20, canvas.width, 2);
      
      if (bossImgRef.current) {
        ctx.drawImage(bossImgRef.current, boss.x, boss.y, boss.width, boss.height);
      }

      obstaclesRef.current.forEach(obs => {
        ctx.fillStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
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
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-3xl border border-[#14F195]/20 my-10 max-w-4xl mx-auto backdrop-blur-xl">
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl min-h-[300px]">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer" />
        
        {/* TOP HUD */}
        <div className="absolute top-4 left-4 z-50 bg-black/80 px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
          <span className="text-[#14F195] font-mono text-2xl font-bold">{displayScore}M</span>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-[250] px-3 py-1 bg-black/80 rounded-lg border border-white/10 text-[10px] font-bold text-white"
        >
          {isMuted ? "MUTED" : "SOUND ON"}
        </button>

        {/* START MENU */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[200]">
            <h2 className="text-white text-3xl font-black italic mb-8 uppercase tracking-tighter">Select Difficulty</h2>
            <div className="flex gap-4 mb-8 relative z-[210]">
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('EASY'); }} 
                className={`px-8 py-3 rounded-xl font-bold border-2 transition-all ${mode === 'EASY' ? 'bg-[#14F195] text-black border-[#14F195]' : 'bg-transparent text-white border-white/20'}`}
              >
                EASY
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('HARD'); }} 
                className={`px-8 py-3 rounded-xl font-bold border-2 transition-all ${mode === 'HARD' ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-white border-white/20'}`}
              >
                HARD
              </button>
            </div>
            <button 
              onClick={() => setGameStarted(true)} 
              className="px-12 py-5 rounded-xl font-black text-2xl bg-white text-black hover:bg-[#14F195] transition-colors"
            >
              START MISSION
            </button>
          </div>
        )}

        {/* GAME OVER MENU */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[220]">
            <h4 className="text-white text-5xl font-black italic mb-8">REKT</h4>
            <div className="flex gap-4">
              <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-[#14F195] text-black px-10 py-4 rounded-xl font-bold">RETRY</button>
              <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-white text-black px-10 py-4 rounded-xl font-bold">MENU</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}