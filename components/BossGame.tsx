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

  // AUDIO REFS
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);

  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const frameCountRef = useRef(0);

  // Initialize Audio
  useEffect(() => {
    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    bgMusic.current = new Audio('/bg-music.mp3');

    if (bgMusic.current) {
      bgMusic.current.loop = true;
      bgMusic.current.volume = isMuted ? 0 : 0.15;
    }
  }, []);

  // Update Volumes when Mute changes
  useEffect(() => {
    if (bgMusic.current) bgMusic.current.volume = isMuted ? 0 : 0.15;
    if (jumpSound.current) jumpSound.current.volume = isMuted ? 0 : 0.3;
    if (deathSound.current) deathSound.current.volume = isMuted ? 0 : 0.4;
  }, [isMuted]);

  // Handle Music Start/Stop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      bgMusic.current?.play().catch(() => {});
    } else {
      bgMusic.current?.pause();
      if (bgMusic.current) bgMusic.current.currentTime = 0;
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    const saved = localStorage.getItem(`boss_high_score_${mode}`);
    setHighScore(saved ? parseInt(saved) : 0);
  }, [mode, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bossImg = new Image();
    bossImg.src = '/boss-icon.png'; 

    let animationFrameId: number;
    let gridOffset = 0;
    
    const boss = { 
      x: 50, y: 150, width: 42, height: 42, 
      dy: 0, jumpForce: -14.2, gravity: 0.8, grounded: false 
    };

    const performJump = () => {
      if (boss.grounded) {
        boss.dy = boss.jumpForce;
        boss.grounded = false;
        if (jumpSound.current) {
          jumpSound.current.currentTime = 0;
          jumpSound.current.play().catch(() => {});
        }
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.target === canvas) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        performJump();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        performJump();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) performJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });

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
      frameCountRef.current++;
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

      const minDistance = mode === 'EASY' 
        ? Math.max(260, 550 - (difficultyScore * 2)) 
        : Math.max(285, 500 - (difficultyScore * 1.5));

      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || (canvas.width - lastObs.x) > minDistance) {
        const type = Math.random() > 0.4 ? 'candle' : 'bear';
        const sizeMult = Math.random() > 0.92 ? 1.2 : Math.random() > 0.4 ? 1.0 : 0.7;
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
        if (
          boss.x + 4 < obs.x + obs.width - 2 &&
          boss.x + boss.width - 4 > obs.x + 2 &&
          boss.y + 4 < obs.y + obs.height - 2 &&
          boss.y + boss.height - 4 > obs.y + 2
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      gridOffset = (gridOffset + currentSpeed) % 40;
      ctx.strokeStyle = mode === 'HARD' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(20, 241, 149, 0.2)';
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }
      ctx.strokeStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height - 20); ctx.stroke();
      if (bossImg.complete) ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
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
      window.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameStarted, gameOver, mode]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-3xl border border-[#14F195]/20 my-10 max-w-4xl mx-auto backdrop-blur-xl touch-none select-none overflow-hidden">
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
          $BOSS <span className={mode === 'HARD' ? 'text-red-500 animate-pulse' : 'text-[#14F195]'}>{mode} MODE</span>
        </h2>
      </div>
      
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer touch-none" style={{ touchAction: 'none' }} />
        
        {/* MUTE BUTTON */}
        <button 
          onPointerDown={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="absolute top-4 right-4 z-[150] p-2 bg-black/60 rounded-lg border border-white/10 text-white/70 hover:text-white transition-colors"
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9l-5 5H2v-6h2l5-5z"></path><path d="M16 9.44a4 4 0 0 1 0 5.12"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
          )}
        </button>

        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[100] p-6">
            <div className="flex flex-row gap-4 mb-8 bg-zinc-800/80 p-2 rounded-2xl border border-white/10 relative z-[110]">
              <button onPointerDown={(e) => { e.stopPropagation(); setMode('EASY'); }} className={`px-6 py-3 rounded-xl font-black transition-all ${mode === 'EASY' ? 'bg-[#14F195] text-black' : 'text-white/40'}`}>EASY</button>
              <button onPointerDown={(e) => { e.stopPropagation(); setMode('HARD'); }} className={`px-6 py-3 rounded-xl font-black transition-all ${mode === 'HARD' ? 'bg-red-600 text-white' : 'text-white/40'}`}>HARD</button>
            </div>
            <button onPointerDown={(e) => { e.stopPropagation(); setGameStarted(true); }} className={`px-12 py-5 rounded-xl font-black text-2xl active:scale-95 transition-all relative z-[110] ${mode === 'HARD' ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'bg-[#14F195] text-black shadow-[0_0_30px_rgba(20,241,149,0.5)]'}`}>START MISSION</button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[120] p-6 text-center">
            <h4 className={`font-black text-4xl md:text-6xl mb-4 italic uppercase tracking-tighter ${mode === 'HARD' ? 'text-red-600' : 'text-white'}`}>REKT</h4>
            <div className="mb-8 text-white font-bold italic uppercase tracking-widest text-sm">
              <p>{mode} Score: {displayScore}M</p>
              <p className="text-[#14F195] text-xs mt-1">Best: {highScore}M</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 relative z-[130]">
              <button onPointerDown={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-white text-black px-12 py-4 rounded-xl font-black uppercase transition-all">Retry</button>
              <button onPointerDown={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-zinc-700 text-white px-12 py-4 rounded-xl font-black uppercase transition-all">Menu</button>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-xl border border-white/10 pointer-events-none z-10">
          <span className={`${mode === 'HARD' ? 'text-red-500' : 'text-[#14F195]'} font-mono text-2xl font-bold`}>{displayScore}M</span>
        </div>
      </div>
    </div>
  );
}