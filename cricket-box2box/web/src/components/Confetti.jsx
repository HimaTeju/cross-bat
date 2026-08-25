import { useEffect, useRef } from "react";

const COLORS = ["#c99a3b", "#e3b756", "#f3ecd8", "#a93226", "#0b2818"];
const EMOJI = ["🏏", "🏆", "🎉"];

export default function Confetti({ duration = 3200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    function spawn() {
      const isEmoji = Math.random() < 0.18;
      return {
        x: Math.random() * width,
        y: -20 - Math.random() * height * 0.5,
        size: isEmoji ? 16 + Math.random() * 10 : 6 + Math.random() * 6,
        speedY: 1.6 + Math.random() * 2.4,
        speedX: (Math.random() - 0.5) * 1.6,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        emoji: isEmoji ? EMOJI[Math.floor(Math.random() * EMOJI.length)] : null,
        sway: Math.random() * Math.PI * 2,
      };
    }

    const particles = Array.from({ length: 140 }, spawn);
    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      const fadeStart = duration - 500;
      const alpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 500) : 1;

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(elapsed / 300 + p.sway) * 0.6;
        p.rotation += p.spin;
        if (p.y > height + 30) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.emoji) {
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (elapsed < duration) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
