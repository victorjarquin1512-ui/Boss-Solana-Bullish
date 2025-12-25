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
  
  // THROTTLE LOGIC: Prevents the mobile "speed surge" glitch
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
      dy: 0, jumpForce: -14.5, gravity: 0.8, grounded: false 
    };

    const handleInput = (e: any) => {
      if (e.cancelable) e.preventDefault();
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
      const baseSpeed = mode === 'EASY' ? 5.5 : 7.2;
      const currentSpeed = baseSpeed + (Math.sqrt(difficultyScore) * (mode === 'EASY' ? 0.25 : 0.45));
      
      boss.dy += 0.85; 
      boss.y += boss.dy;

      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      const minDistance = mode === 'EASY' ? 290 : 330;
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || (canvas.width - lastObs.x) > minDistance) {
        obstaclesRef.current.push({ 
          x: canvas.width, y: canvas.height - 52, 
          width: 32, height: 32, type: 'candle' 
        });
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;
        if (boss.x + 5 < obs.x + obs.width && boss.x + boss.width - 5 > obs.x && 
            boss.y + 5 < obs.y + obs.height && boss.y + boss.height - 5 > obs.y) {
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
      ctx.strokeStyle = 'rgba(20, 241, 149, 0.08)';
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }
      ctx.strokeStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, canvas.height - 20, canvas.width, 1);
      
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 select-none">
      
      {/* GAME AREA */}
      <div className="relative w-full max-w-4xl overflow-hidden bg-black rounded-3xl border border-[#14F195]/20 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer block" />
        
        <div className="absolute top-6 left-6 z-50 bg-black/60 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 pointer-events-none">
          <span className="text-[#14F195] font-mono text-3xl font-bold italic">{displayScore}M</span>
        </div>

        <button onClick={() => setIsMuted(!isMuted)} className="absolute top-6 right-6 z-[250] px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-white uppercase hover:bg-white hover:text-black transition-all">
          {isMuted ? "Audio: OFF" : "Audio: ON"}
        </button>

        {/* START MENU */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[200] backdrop-blur-sm">
            <h2 className="text-white text-4xl font-black italic mb-10 uppercase tracking-tighter text-center">JOIN THE MISSION</h2>
            <div className="flex gap-6 mb-10 relative z-[210]">
              <button onClick={(e) => { e.stopPropagation(); setMode('EASY'); }} className={`px-10 py-4 rounded-2xl font-black border-2 transition-all ${mode === 'EASY' ? 'bg-[#14F195] text-black border-[#14F195]' : 'bg-transparent text-white border-white/20'}`}>EASY</button>
              <button onClick={(e) => { e.stopPropagation(); setMode('HARD'); }} className={`px-10 py-4 rounded-2xl font-black border-2 transition-all ${mode === 'HARD' ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-white border-white/20'}`}>HARD</button>
            </div>
            <button onClick={() => setGameStarted(true)} className="px-16 py-6 rounded-2xl font-black text-3xl bg-white text-black hover:bg-[#14F195] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(20,241,149,0.3)]">START</button>
          </div>
        )}

        {/* GAME OVER */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[220] backdrop-blur-md">
            <h4 className="text-red-600 text-7xl font-black italic mb-10 tracking-tighter uppercase">REKT</h4>
            <div className="flex gap-6">
              <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-[#14F195] text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all">RETRY</button>
              <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all">MENU</button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING SOCIAL DOCK */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[300]">
        <a 
          href="https://t.me/Boss_Solana_Bull_Official" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-[#229ED9] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 hover:shadow-[0_0_20px_rgba(34,158,217,0.5)]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0C5.352 0 0 5.352 0 11.944c0 6.592 5.352 11.944 11.944 11.944 6.592 0 11.944-5.352 11.944-11.944C23.888 5.352 18.536 0 11.944 0zm5.859 8.125c-.19.982-1.802 8.657-2.618 13.064-.347 1.861-1.033 1.956-1.697 1.956-1.444 0-2.534-1.066-3.931-1.983-2.185-1.436-3.419-2.329-5.541-3.725-2.454-1.613-.863-2.5 0-3.812.226-.341 4.14-3.793 4.215-4.11.01-.038.018-.182-.072-.26-.09-.079-.222-.053-.318-.032-.136.03-2.306 1.464-6.505 4.305-.615.422-1.171.628-1.668.617-.548-.012-1.603-.31-2.387-.565-.963-.313-1.728-.479-1.662-1.011.034-.277.416-.561 1.144-.852 4.478-1.951 7.462-3.238 8.953-3.86 4.256-1.775 5.141-2.083 5.717-2.093.126-.002.41.029.593.178.154.125.197.294.212.414.015.12.033.473.018.847z"/>
          </svg>
        </a>
        <a 
          href="https://x.com/Boss_Solana" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-black text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}