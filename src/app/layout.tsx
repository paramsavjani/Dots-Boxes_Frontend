"use client";


import localFont from "next/font/local";
import "./globals.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function InteractiveBackground() {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - lastMousePos.current.x;
      const deltaY = event.clientY - lastMousePos.current.y;

      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;

      lastMousePos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const delta = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;

      targetZoomRef.current = Math.max(
        0.3,
        Math.min(3, targetZoomRef.current * delta)
      );
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging.current = true;
        const touch = event.touches[0];
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDragging.current || event.touches.length === 0) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - lastMousePos.current.x;
      const deltaY = touch.clientY - lastMousePos.current.y;

      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;

      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Smooth interpolation for rotation
      groupRef.current.rotation.x +=
        (targetRotationRef.current.x - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y +=
        (targetRotationRef.current.y - groupRef.current.rotation.y) * 0.05;

      // Smooth interpolation for zoom
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.1;
      groupRef.current.scale.setScalar(zoomRef.current);
    }
  });

  return (
    <group ref={groupRef}>
      <GlobalParticleSystem />
    </group>
  );
}


// Global particle system for all pages
function GlobalParticleSystem() {
  const particlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!particlesRef.current) return;

    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // SLoP color palette
    const colorPalette = [
      new THREE.Color("#ff6b6b"), // Coral/Red
      new THREE.Color("#4ecdc4"), // Teal
      new THREE.Color("#45b7d1"), // Blue
      new THREE.Color("#96ceb4"), // Green
      new THREE.Color("#feca57"), // Yellow
      new THREE.Color("#ff9ff3"), // Pink
      new THREE.Color("#a8e6cf"), // Light green
      new THREE.Color("#6c5ce7"), // Purple
    ];

    for (let i = 0; i < particleCount; i++) {
      // Spread particles across a larger area
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const color =
        colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = particlesRef.current.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      particlesRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.05;

      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] +=
          Math.sin(state.clock.elapsedTime * 0.5 + positions[i]) * 0.008;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={2.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Floating sphere clusters


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <title>Loops & Squares - Multiplayer Gaming</title>
        <meta
          name="description"
          content="Challenge players worldwide in exciting loops and squares gameplay. Real-time multiplayer gaming experience."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4ecdc4" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative overflow-hidden`}
      >
        {/* Global Three.js Background - Applied to ALL pages */}
        <div className="fixed inset-0 z-0">
          <Canvas
            className="w-full h-full"
            camera={{ position: [0, 0, 30], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <fog attach="fog" args={["#000000", 20, 100]} />

            <ambientLight intensity={0.3} />
            <directionalLight
              position={[15, 15, 10]}
              intensity={0.4}
              color="#4ecdc4"
            />
            <pointLight
              position={[-15, 15, 15]}
              intensity={0.3}
              color="#ff6b6b"
            />
            <pointLight
              position={[15, -15, -15]}
              intensity={0.3}
              color="#feca57"
            />
            <pointLight position={[0, 0, 20]} intensity={0.2} color="#45b7d1" />

            <InteractiveBackground />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              enabled={false}
            />
          </Canvas>
        </div>

        {/* Dark overlay for better text readability */}
        <div className="fixed inset-0 z-[1] bg-gradient-to-br from-black/40 via-black/20 to-black/40" />

        {/* Page Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
