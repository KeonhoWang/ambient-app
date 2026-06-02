import { useEffect, useRef } from "react";

export default function ParticleBackground({ activeSounds }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  const getColor = () => {
    if (activeSounds.includes("fire")) return "#ff6b35";
    if (activeSounds.includes("ocean")) return "#06b6d4";
    if (activeSounds.includes("rain")) return "#60a5fa";
    if (activeSounds.includes("wind")) return "#5eead4";
    if (activeSounds.includes("birds")) return "#86efac";
    if (activeSounds.includes("cafe")) return "#fbbf24";
    return "#ffffff";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 4 + 1,
      speedY: -(Math.random() * 1.5 + 0.5),
      speedX: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.6 + 0.2,
      color: getColor(),
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeSounds.length > 0) {
        if (particlesRef.current.length < 80) {
          particlesRef.current.push(createParticle());
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => p.y > -10);

      particlesRef.current.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity -= 0.002;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.floor(p.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [activeSounds]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
