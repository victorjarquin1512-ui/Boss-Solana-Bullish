'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function BossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Refs handle the core engine to prevent React re-render flickering
  const scoreRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const frameCountRef = useRef(0);

  // Load High Score on Mount
  useEffect(() => {
    const saved = localStorage.getItem('boss_high_score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

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
    
    // Physics Constants
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

    window.addEventListener('keydown', handleKeyDown);
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

      // LOGARITHMIC DIFFICULTY SCALING
      // The game gets harder slower as the score increases
      const speedBonus = Math.sqrt(scoreRef.current) * 0.5; 
      const currentSpeed = 6 + speedBonus; 
      const currentGravity = 0.8 + (scoreRef.current * 0.005);

      // Boss Physics
      boss.dy += currentGravity;
      boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      // Adaptive Spawning
      const minDistance = Math.max(180, 450 - (scoreRef.current * 5));
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      
      if (!lastObs || (canvas.width - lastObs.x) > minDistance) {
        const type = Math.random() > 0.4 ? 'candle' : 'bear';
        const sizeRoll = Math.random();
        const sizeMult = sizeRoll > 0.92 ? 1.3 : sizeRoll > 0.4 ? 1.0 : 0.7;

        obstaclesRef.current.push({ 
          x: canvas.width, 
          y: canvas.height - (type === 'candle' ? (60 * sizeMult + 20) : (30 * sizeMult + 20)), 
          width: 30 * sizeMult, height: type === 'candle' ? (50 * sizeMult) : (30 * sizeMult), 
          type 
        });
      }

      // Movement & Collision
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;
        
        if (boss.x + 12 < obs.x + obs.width - 12 && 
            boss.x + boss.width - 12 > obs.x + 12 &&
            boss.y + 12 < obs.y + obs.height - 12 && 
            boss.y + boss.height - 12 > obs.y + 12) {
          
          const finalScore = scoreRef.current;
          const currentHigh = parseInt(localStorage.getItem('boss_high_score') || '0');
          if (finalScore > currentHigh) {
            localStorage.setItem('boss_high_score', finalScore.toString());
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

      // Render Batch
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      gridOffset = (gridOffset + currentSpeed) % 40;
      ctx.strokeStyle = scoreRef.current > 15 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(20, 241, 149, 0.2)';
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }

      ctx.strokeStyle = scoreRef.current > 15 ? '#ff4d4d' : '#14F195';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height - 20); ctx.stroke();

      if (bossImg.complete) ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

      obstaclesRef.current.forEach(obs => {
        if (obs.type === 'candle') {
          ctx.fillStyle = '#ff4d4d';
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
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameStarted, gameOver]);

  const shareOnX = () => {
    const text = encodeURIComponent(`Survived to ${displayScore}M MCAP on $BOSS! 🐂🚀 High Score: ${highScore}M. Play here:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/40 rounded-3xl border border-[#14F195]/20 my-20 max-w-4xl mx-auto backdrop-blur-xl touch-none select-none">
      <div className="text-center mb-6">
        <h2 className={`text-2xl md:text-4xl font-black italic uppercase tracking-tighter transition-colors ${displayScore > 15 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          $BOSS <span className={displayScore > 15 ? 'text-white' : 'text-[#14F195]'}>VOLATILITY RUN</span>
        </h2>
      </div>
      
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto cursor-pointer" />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <button onClick={() => setGameStarted(true)} className="bg-[#14F195] text-black px-12 py-4 rounded-xl font-black text-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(20,241,149,0.3)]">
              START GAME
            </button>
            <p className="text-white/40 text-[10px] mt-4 uppercase font-bold tracking-widest">Personal Best: {highScore}M</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 text-center">
            <h4 className="text-red-600 font-black text-4xl md:text-6xl mb-2 italic uppercase">Liquidated</h4>
            <div className="mb-8">
              <p className="text-white font-bold text-lg italic uppercase tracking-wider">Score: {displayScore}M</p>
              <p className="text-[#14F195] text-xs font-bold uppercase tracking-widest mt-1">Best: {highScore}M</p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4 w-full px-10">
              <button onClick={() => { 
                scoreRef.current = 0;
                obstaclesRef.current = [];
                setGameOver(false); 
                setDisplayScore(0); 
              }} className="bg-white text-black px-10 py-3 rounded-lg font-black uppercase hover:bg-[#14F195] transition-all">
                Try Again
              </button>
              <button onClick={shareOnX} className="bg-[#1DA1F2] text-white px-10 py-3 rounded-lg font-black uppercase flex items-center justify-center gap-2">
                Share Score
              </button>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded-lg border border-[#14F195]/30">
          <span className="text-[#14F195] font-mono text-xl font-bold">{displayScore}M</span>
        </div>
      </div>
      <p className="text-zinc-500 text-[10px] uppercase font-bold mt-4 tracking-widest opacity-50">Space or Tap to Jump</p>
    </div>
  );
}