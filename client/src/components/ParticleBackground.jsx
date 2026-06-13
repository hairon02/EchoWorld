import React, { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Set canvas size in JavaScript
    canvas.width = width;
    canvas.height = height;

    // Create 60 atmospheric particles
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.4 + 0.7,
        color: Math.random() > 0.5 ? "#c9a84c" : "#e8e0d0",
        opacityDirection: Math.random() > 0.5 ? 0.002 : -0.002,
      });
    }
    particlesRef.current = particles;

    // Handle window resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Set globalAlpha before drawing
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Move particle upward
        particle.y -= particle.speedY;

        // Sway horizontally
        particle.x += particle.speedX;

        // Pulse opacity
        particle.opacity += particle.opacityDirection;

        // Reverse opacity direction at bounds
        if (particle.opacity >= 0.6 || particle.opacity <= 0.1) {
          particle.opacityDirection *= -1;
        }

        // Reset if particle goes above viewport
        if (particle.y < 0) {
          particle.y = height;
          particle.x = Math.random() * width;
        }

        // Reset globalAlpha after drawing
        ctx.globalAlpha = 1;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
