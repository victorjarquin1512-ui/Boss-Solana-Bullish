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

  // Engine Refs for smooth performance
  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const frameCountRef = useRef(0);

  // Load High Scores
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
      x: 50, y: 150, width: 48, height: 48, 
      dy: 0, jumpForce: -14.2, gravity: 0.8, grounded: false 
    };

    const performJump = () => {
      if (boss.grounded) {
        boss.dy = boss.jumpForce;
        boss.grounded = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        performJump();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      performJump();
    };

    // MOUSE SUPPORT
    const handleMouseDown = (e: MouseEvent) => {
      // Prevent jumping when clicking UI buttons
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

      // STAGED DIFFICULTY LOGIC (Plateaus: 80 for Easy, 40 for Hard)
      const threshold = mode === 'EASY' ? 80 : 40;
      const difficultyScore = Math.max(0, scoreRef.current - threshold);
      
      const baseSpeed = mode === 'EASY' ? 5.5 : 7.0;
      const speedMultiplier = mode === 'EASY' ? 0.25 : 0.4;
      
      const currentSpeed = baseSpeed + (Math.sqrt(difficultyScore) * speedMultiplier);
      const currentGravity = 0.8 + (difficultyScore * (mode === 'EASY' ? 0.001 : 0.003));

      boss.dy += currentGravity;
      boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      // SPACING LOGIC (Hard mode spreads out as speed increases)
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
        
        if (boss.x + 12 < obs.x + obs.width - 12 && 
            boss.x + boss.width - 12 > obs.x + 12 &&
            boss.y + 12 < obs.y + obs.height - 12 && 
            boss.y + boss.height - 12 > obs.y + 12) {
          
          const finalScore = scoreRef.current;
          const currentHigh = parseInt(localStorage.getItem(`boss_high_score_${mode}`) || '0');
          if (finalScore > currentHigh) {
            localStorage.setItem(`boss_high_score_${mode}`, finalScore.toString());
            setHighScore(finalScore);
          }
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
        } else {
          drawBear(obs);
        }
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
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
          $BOSS <span className={mode === 'HARD' ? 'text-red-500 animate-pulse' : 'text-[#14F195]'}>{mode} MODE</span>
        </h2>
      </div>
      
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer" style={{ touchAction: 'none' }} />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6">
            <div className="flex gap-4 mb-8 bg-zinc-800/50 p-2 rounded-2xl border border-white/5">
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('EASY'); }} 
                className={`px-6 py-2 rounded-xl font-black transition-all ${mode === 'EASY' ? 'bg-[#14F195] text-black shadow-[0_0_15px_rgba(20,241,149,0.4)]' : 'text-white/40'}`}
              >EASY</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setMode('HARD'); }} 
                className={`px-6 py-2 rounded-xl font-black transition-all ${mode === 'HARD' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-white/40'}`}
              >HARD</button>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setGameStarted(true); }} 
              className={`px-12 py-4 rounded-xl font-black text-xl active:scale-95 transition-all ${mode === 'HARD' ? 'bg-red-600 text-white' : 'bg-[#14F195] text-black'}`}
            >START</button>
            <p className="text-white/30 text-[10px] mt-6 uppercase font-bold tracking-[0.2em]">{mode} Record: {highScore}M</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 text-center">
            <h4 className={`font-black text-4xl md:text-6xl mb-2 italic uppercase tracking-tighter ${mode === 'HARD' ? 'text-red-600' : 'text-white'}`}>REKT</h4>
            <div className="mb-8 text-white font-bold italic uppercase tracking-widest text-sm">
              <p>{mode} Score: {displayScore}M</p>
              <p className="text-[#14F195] text-xs mt-1">Best: {highScore}M</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <button onClick={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setDisplayScore(0); }} className="bg-white text-black px-10 py-3 rounded-lg font-black uppercase hover:bg-[#14F195] transition-all">Retry</button>
              <button onClick={(e) => { e.stopPropagation(); scoreRef.current = 0; obstaclesRef.current = []; setGameOver(false); setGameStarted(false); setDisplayScore(0); }} className="bg-zinc-700 text-white px-10 py-3 rounded-lg font-black uppercase hover:bg-zinc-600">Menu</button>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded-lg border border-white/10 pointer-events-none">
          <span className={`${mode === 'HARD' ? 'text-red-500' : 'text-[#14F195]'} font-mono text-xl font-bold`}>{displayScore}M</span>
        </div>
      </div>
      <p className="text-zinc-500 text-[10px] uppercase font-bold mt-4 tracking-widest opacity-40 italic">Space, Click, or Tap to Jump</p>
    </div>
  );
}