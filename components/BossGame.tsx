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

  // Engine Refs
  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const bossImgRef = useRef<HTMLImageElement | null>(null);
  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  
  // Singleton Loop & Input Control
  const lastJumpTime = useRef(0);
  const jumpRequested = useRef(false);
  const requestRef = useRef<number | null>(null);

  // 1. Initialize Assets
  useEffect(() => {
    const img = new Image();
    img.src = '/boss-icon.png';
    img.onload = () => { bossImgRef.current = img; };

    jumpSound.current = new Audio('/jump.mp3');
    deathSound.current = new Audio('/death.mp3');
    
    // Setup Background Music
    const music = new Audio('/bg-music.mp3');
    music.loop = true;
    music.preload = 'auto';
    bgMusic.current = music;
  }, []);

  // 2. Audio State Sync
  useEffect(() => {
    if (bgMusic.current) {
      bgMusic.current.volume = isMuted ? 0 : 0.15;
      if (gameStarted && !gameOver && !isMuted) {
        bgMusic.current.play().catch(() => {
          console.log("Audio waiting for user interaction...");
        });
      } else {
        bgMusic.current.pause();
      }
    }
  }, [isMuted, gameStarted, gameOver]);

  // 3. The "Unlocker" Function
  const startMission = async () => {
    // Browsers require audio to be triggered by a direct click event
    if (bgMusic.current) {
      try {
        bgMusic.current.currentTime = 0;
        await bgMusic.current.play();
      } catch (err) {
        console.error("Audio playback failed:", err);
      }
    }
    
    // Prime sound effects
    [jumpSound, deathSound].forEach(s => {
      if (s.current) {
        s.current.play().then(() => {
          s.current!.pause();
          s.current!.currentTime = 0;
        }).catch(() => {});
      }
    });

    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let gridOffset = 0;
    const boss = { 
      x: 50, y: 150, width: 42, height: 42, 
      dy: 0, jumpForce: -14.5, gravity: 0.82, grounded: false 
    };

    const drawBear = (obs: any) => {
      const { x, y, width } = obs;
      const scale = width / 30; 
      
      ctx.fillStyle = '#4a2b10'; 
      ctx.beginPath(); ctx.arc(x + (5 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (25 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (15 * scale), 15 * scale, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = '#d2b48c'; 
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (21 * scale), 7 * scale, 0, Math.PI * 2); ctx.fill();
      
      ctx.strokeStyle = '#000'; 
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x + (8 * scale), y + (10 * scale)); ctx.lineTo(x + (12 * scale), y + (14 * scale));
      ctx.moveTo(x + (12 * scale), y + (10 * scale)); ctx.lineTo(x + (8 * scale), y + (14 * scale));
      ctx.moveTo(x + (18 * scale), y + (10 * scale)); ctx.lineTo(x + (22 * scale), y + (14 * scale));
      ctx.moveTo(x + (22 * scale), y + (10 * scale)); ctx.lineTo(x + (18 * scale), y + (14 * scale));
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + (15 * scale), y + (25 * scale), 4 * scale, 0, Math.PI, true); 
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (19 * scale), 2 * scale, 0, Math.PI * 2); ctx.fill();
    };

    const handleInput = (e: any) => {
      if (e.cancelable) e.preventDefault();
      const now = Date.now();
      if (now - lastJumpTime.current > 150) {
        jumpRequested.current = true;
        lastJumpTime.current = now;
      }
    };

    window.addEventListener('keydown', (e) => { if (e.code === 'Space') jumpRequested.current = true; });
    canvas.addEventListener('touchstart', handleInput, { passive: false });
    canvas.addEventListener('mousedown', handleInput);

    const update = () => {
      if (jumpRequested.current) {
        if (boss.grounded) {
          boss.dy = boss.jumpForce;
          boss.grounded = false;
          if (jumpSound.current && !isMuted) { jumpSound.current.currentTime = 0; jumpSound.current.play().catch(() => {}); }
        }
        jumpRequested.current = false;
      }

      const threshold = mode === 'EASY' ? 80 : 40;
      const difficultyScore = Math.max(0, scoreRef.current - threshold);
      const baseSpeed = mode === 'EASY' ? 5.8 : 7.5;
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
        const type = Math.random() > 0.4 ? 'candle' : 'bear';
        obstaclesRef.current.push({ 
          x: canvas.width, 
          y: canvas.height - (type === 'candle' ? 70 : 52), 
          width: 32, height: type === 'candle' ? 50 : 32, 
          type 
        });
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;
        if (boss.x + 8 < obs.x + obs.width && boss.x + boss.width - 8 > obs.x && 
            boss.y + 8 < obs.y + obs.height && boss.y + boss.height - 8 > obs.y) {
          if (deathSound.current && !isMuted) deathSound.current.play().catch(() => {});
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

      if (bossImgRef.current) ctx.drawImage(bossImgRef.current, boss.x, boss.y, boss.width, boss.height);

      obstaclesRef.current.forEach(obs => {
        if (obs.type === 'candle') {
          ctx.fillStyle = mode === 'HARD' ? '#ff4d4d' : '#14F195';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillRect(obs.x + (obs.width / 2) - 1, obs.y - 10, 2, 10);
        } else {
          drawBear(obs);
        }
      });

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener('mousedown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
    };
  }, [gameStarted, gameOver, mode, isMuted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-2 md:p-4 select-none touch-none overflow-hidden">
      
      <div className="relative w-full max-w-[95vw] md:max-w-4xl aspect-[8/3] bg-black rounded-xl md:rounded-3xl border border-[#14F195]/20 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-contain block" />
        
        <div className="absolute top-3 left-3 md:top-6 md:left-6 z-50 bg-black/80 px-4 py-1 rounded-xl border border-white/10 font-mono text-xl md:text-3xl text-[#14F195]">
          {displayScore}M
        </div>

        <button onClick={() => setIsMuted(!isMuted)} className="absolute top-3 right-3 z-[250] bg-black/60 p-2 rounded-lg border border-white/10 text-white text-xs">
          {isMuted ? "🔇" : "🔊"}
        </button>

        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[200] p-6">
            <h2 className="text-white text-2xl md:text-4xl font-black italic mb-6 uppercase tracking-tighter">JOIN THE MISSION</h2>
            <div className="flex gap-4 mb-8 z-[210]">
              <button onClick={() => setMode('EASY')} className={`px-6 py-3 md:px-12 md:py-4 rounded-xl font-black border-2 transition-all ${mode === 'EASY' ? 'bg-[#14F195] text-black border-[#14F195]' : 'text-white border-white/20'}`}>EASY</button>
              <button onClick={() => setMode('HARD')} className={`px-6 py-3 md:px-12 md:py-4 rounded-xl font-black border-2 transition-all ${mode === 'HARD' ? 'bg-red-600 text-white border-red-600' : 'text-white border-white/20'}`}>HARD</button>
            </div>
            <button onClick={startMission} className="px-12 py-4 md:px-20 md:py-6 rounded-2xl bg-white text-black font-black text-xl md:text-3xl hover:bg-[#14F195] active:scale-95 shadow-xl transition-all">START</button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[220] p-6">
            <h4 className="text-red-600 text-6xl md:text-8xl font-black italic mb-8 uppercase tracking-tighter">REKT</h4>
            <div className="flex gap-4 z-[230]">
                <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-[#14F195] px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-black text-lg md:text-xl active:scale-95 transition-all">RETRY</button>
                <button onClick={() => { scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-white px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-black text-lg md:text-xl active:scale-95 transition-all">MENU</button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-[300]">
        <a 
          href="https://t.me/Boss_Solana_Bull_Official" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-[#229ED9] p-4 rounded-full text-white shadow-[0_0_20px_rgba(34,158,217,0.5)] border border-white/20 hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
        >
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0C5.352 0 0 5.352 0 11.944c0 6.592 5.352 11.944 11.944 11.944 6.592 0 11.944-5.552 11.944-11.944C23.888 5.352 18.536 0 11.944 0zm5.859 8.125c-.19.982-1.802 8.657-2.618 13.064-.347 1.861-1.033 1.956-1.697 1.956-1.444 0-2.534-1.066-3.931-1.983-2.185-1.436-3.419-2.329-5.541-3.725-2.454-1.613-.863-2.5 0-3.812.226-.341 4.14-3.793 4.215-4.11.01-.038.018-.182-.072-.26-.09-.079-.222-.053-.318-.032-.136.03-2.306 1.464-6.505 4.305-.615.422-1.171.628-1.668.617-.548-.012-1.603-.31-2.387-.565-.963-.313-1.728-.479-1.662-1.011.034-.277.416-.561 1.144-.852 4.478-1.951 7.462-3.238 8.953-3.86 4.256-1.775 5.141-2.083 5.717-2.093.126-.002.41.029.593.178.154.125.197.294.212.414.015.12.033.473.018.847z"/></svg>
        </a>
      </div>
    </div>
  );
}