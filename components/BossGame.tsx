'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function BossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bossImg = new Image();
    bossImg.src = '/boss-icon.png'; 

    let animationFrameId: number;
    let frameCount = 0;
    
    // Adjusted Jump Force (-14.5) and Gravity (0.8) to give a higher, smoother arc
    const boss = { 
      x: 50, y: 150, width: 48, height: 48, 
      dy: 0, jumpForce: -14.5, gravity: 0.8, grounded: false 
    };
    
    let obstacles: any[] = [];
    let gridOffset = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        if (boss.grounded) {
          boss.dy = boss.jumpForce;
          boss.grounded = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const drawBear = (obs: any) => {
      const { x, y, width } = obs;
      const scale = width / 30; 
      ctx.fillStyle = '#4a2b10'; 
      ctx.beginPath(); ctx.arc(x + (5 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (25 * scale), y + (5 * scale), 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (15 * scale), 15 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d2b48c'; 
      ctx.beginPath(); ctx.arc(x + (15 * scale), y + (22 * scale), 7 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * scale;
      ctx.beginPath(); ctx.moveTo(x + (8 * scale), y + (10 * scale)); ctx.lineTo(x + (12 * scale), y + (14 * scale)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + (22 * scale), y + (10 * scale)); ctx.lineTo(x + (18 * scale), y + (14 * scale)); ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(x + (13 * scale), y + (18 * scale), 4 * scale, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(x + (11 * scale), y + (25 * scale)); ctx.quadraticCurveTo(x + (15 * scale), y + (22 * scale), x + (19 * scale), y + (25 * scale));
      ctx.stroke();
    };

    const update = () => {
      frameCount++;
      const currentSpeed = 8 + (score * 0.35); 
      
      // Dynamic gravity scaling - keeps the jump feel consistent as speed increases
      boss.gravity = 0.8 + (score * 0.015);

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = score > 15 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(20, 241, 149, 0.2)';
      gridOffset = (gridOffset + currentSpeed) % 40;
      for (let i = 0; i < canvas.width + 40; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - gridOffset, 0); ctx.lineTo(i - gridOffset, canvas.height); ctx.stroke();
      }

      const lastObstacle = obstacles[obstacles.length - 1];
      const minDistance = Math.max(130, 310 - (score * 11));
      
      if (!lastObstacle || (canvas.width - lastObstacle.x) > minDistance) {
        const type = Math.random() > 0.4 ? 'candle' : 'bear';
        const sizeRoll = Math.random();
        
        // CAP THE SIZE: Maximum multiplier is 1.4 now to ensure jumpability
        const sizeMult = sizeRoll > 0.85 ? 1.4 : sizeRoll > 0.4 ? 1.0 : 0.7;

        obstacles.push({ 
          x: canvas.width, 
          y: canvas.height - (type === 'candle' ? (65 * sizeMult + 20) : (30 * sizeMult + 20)), 
          width: 30 * sizeMult, 
          height: type === 'candle' ? (55 * sizeMult) : (30 * sizeMult), 
          type 
        });
      }

      boss.dy += boss.gravity;
      boss.y += boss.dy;
      if (boss.y + boss.height > canvas.height - 20) {
        boss.y = canvas.height - 20 - boss.height;
        boss.dy = 0; boss.grounded = true;
      }

      ctx.strokeStyle = score > 15 ? '#ff4d4d' : '#14F195';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height - 20); ctx.stroke();

      if (bossImg.complete) ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= currentSpeed;
        
        if (obstacles[i].type === 'candle') {
          ctx.fillStyle = '#ff4d4d';
          const wickH = obstacles[i].height * 0.4;
          ctx.fillRect(obstacles[i].x + (obstacles[i].width / 2) - 1, obstacles[i].y - wickH, 2, obstacles[i].height + (wickH * 2));
          ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
        } else {
          drawBear(obstacles[i]); 
        }

        if (boss.x + 10 < obstacles[i].x + obstacles[i].width - 10 && 
            boss.x + boss.width - 10 > obstacles[i].x + 10 &&
            boss.y + 10 < obstacles[i].y + obstacles[i].height - 10 && 
            boss.y + boss.height - 10 > obstacles[i].y + 10) {
          setGameOver(true);
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
          setScore(s => s + 1);
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  const shareOnX = () => {
    const text = encodeURIComponent(`I survived the bears and hit a ${score}M Market Cap on $BOSS! 🐂🚀\n\nPlay here: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n#BOSS #Solana #BullRun`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/40 rounded-3xl border border-[#14F195]/20 my-20 max-w-4xl mx-auto backdrop-blur-xl">
      <div className="text-center mb-6">
        <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${score > 15 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          $BOSS <span className={score > 15 ? 'text-white' : 'text-[#14F195]'}>VOLATILITY RUN</span>
        </h2>
      </div>
      
      <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto" />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <button onClick={() => setGameStarted(true)} className="bg-[#14F195] text-black px-12 py-4 rounded-xl font-black text-xl hover:scale-105 transition-all">
              START THE GAUNTLET
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 text-center">
            <h4 className="text-red-600 font-black text-6xl mb-2 italic">REKT</h4>
            <p className="text-zinc-500 font-bold mb-8 uppercase tracking-widest italic">MCAP SURVIVED: {score}M</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => { setGameOver(false); setScore(0); }} className="bg-white text-black px-10 py-3 rounded-lg font-black uppercase hover:bg-[#14F195] transition-colors">
                RETRY
              </button>
              <button onClick={shareOnX} className="bg-[#1DA1F2] text-white px-10 py-3 rounded-lg font-black uppercase flex items-center gap-2 hover:bg-sky-400">
                SHARE ON X
              </button>
            </div>
          </div>
        )}
        
        <div className="absolute top-6 left-6 bg-black/80 px-4 py-2 rounded-lg border border-[#14F195]/30">
          <span className="text-[#14F195] font-mono text-2xl font-bold">{score}M</span>
        </div>
      </div>
    </div>
  );
}