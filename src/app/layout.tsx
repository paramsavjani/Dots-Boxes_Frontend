"use client";

import localFont from "next/font/local";
import "./globals.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useMemo } from "react";
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
  const lastTouchDistance = useRef(0);

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

    const handleMouseUp = () => (isDragging.current = false);

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
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1 && isDragging.current) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - lastMousePos.current.x;
        const deltaY = touch.clientY - lastMousePos.current.y;
        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const zoomFactor = distance / lastTouchDistance.current;
        targetZoomRef.current = Math.max(
          0.3,
          Math.min(3, targetZoomRef.current * zoomFactor)
        );
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) lastTouchDistance.current = 0;
      if (event.touches.length === 0) isDragging.current = false;
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
      groupRef.current.rotation.x +=
        (targetRotationRef.current.x - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y +=
        (targetRotationRef.current.y - groupRef.current.rotation.y) * 0.05;

      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.1;
      groupRef.current.scale.setScalar(zoomRef.current);
    }
  });

  return (
    <group ref={groupRef}>
      <MetallicBallSystem />
    </group>
  );
}

// Individual metallic ball component
function MetallicBall({
  position,
  color,
  size,
  rotationSpeed,
}: {
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  rotationSpeed: { x: number; y: number; z: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (meshRef.current) {
      // Individual rotation
      meshRef.current.rotation.x += rotationSpeed.x;
      meshRef.current.rotation.y += rotationSpeed.y;
      meshRef.current.rotation.z += rotationSpeed.z;

      // Enhanced floating animation with varied patterns
      meshRef.current.position.y =
        initialY +
        Math.sin(state.clock.elapsedTime * 0.8 + position[0] * 0.1) * 3 +
        Math.cos(state.clock.elapsedTime * 0.3 + position[2] * 0.05) * 1.5;

      // Subtle x-axis movement
      meshRef.current.position.x =
        position[0] +
        Math.sin(state.clock.elapsedTime * 0.2 + position[1] * 0.1) * 0.5;
    }
  });

  // Create brighter, more vibrant color
  const brightColor = color.clone().multiplyScalar(1.8);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 20, 16]} />
      <meshStandardMaterial
        color={brightColor}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Global metallic ball system
function MetallicBallSystem() {
  const groupRef = useRef<THREE.Group>(null);

  const balls = useMemo(() => {
    const ballCount = 400; // Increased density
    const ballsData = [];

    // Brighter, more vibrant color palette
    const colorPalette = [
      new THREE.Color("#ff8a8a"), // Bright coral
      new THREE.Color("#5fedd6"), // Bright teal
      new THREE.Color("#70c8ff"), // Bright blue
      new THREE.Color("#a8e6a1"), // Bright green
      new THREE.Color("#ffd93d"), // Bright yellow
      new THREE.Color("#ffb3ff"), // Bright pink
      new THREE.Color("#b8f5cd"), // Bright mint
      new THREE.Color("#9b8ce8"), // Bright purple
      new THREE.Color("#ffa8a8"), // Light red
      new THREE.Color("#87ceeb"), // Sky blue
      new THREE.Color("#98fb98"), // Pale green
      new THREE.Color("#f0e68c"), // Khaki
    ];

    for (let i = 0; i < ballCount; i++) {
      ballsData.push({
        position: [
          (Math.random() - 0.5) * 200, // Wider X distribution
          (Math.random() - 0.5) * 20, // Wider Y distribution
          (Math.random() - 0.5) * 200, // Wider Z distribution
        ] as [number, number, number],
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        size: Math.random() * 1.2 + 0.4, // Larger balls: 0.4 to 1.6
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.03,
          y: (Math.random() - 0.5) * 0.03,
          z: (Math.random() - 0.5) * 0.03,
        },
        key: i,
      });
    }

    return ballsData;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle global rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.08) * 0.02;
      groupRef.current.rotation.z =
        Math.cos(state.clock.elapsedTime * 0.05) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {balls.map((ball) => (
        <MetallicBall
          key={ball.key}
          position={ball.position}
          color={ball.color}
          size={ball.size}
          rotationSpeed={ball.rotationSpeed}
        />
      ))}
    </group>
  );
}

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
        {/* Global Three.js Background with Metallic Balls */}
        <div className="fixed inset-0 z-0">
          <Canvas
            className="w-full h-full"
            camera={{ position: [100, 0, 10], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <fog attach="fog" args={["#000000", 30, 1200]} />

            {/* Enhanced lighting system for bright metallic balls */}
            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight
              position={[20, 20, 15]}
              intensity={0.8}
              color="#ffffff"
              castShadow
            />
            <directionalLight
              position={[-20, 15, 15]}
              intensity={0.6}
              color="#4ecdc4"
            />
            <pointLight
              position={[25, -20, -20]}
              intensity={0.7}
              color="#ffd93d"
            />
            <pointLight position={[0, 0, 25]} intensity={0.5} color="#70c8ff" />
            <pointLight
              position={[-25, 0, 20]}
              intensity={0.5}
              color="#ff8a8a"
            />
            <pointLight position={[0, 25, 0]} intensity={0.4} color="#9b8ce8" />

            {/* Rim lighting for better edge definition */}
            <hemisphereLight args={["#ffffff", "#4ecdc4", 0.3]} />

            <InteractiveBackground />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              enabled={false}
            />
          </Canvas>
        </div>

        {/* Lighter dark overlay for better ball visibility */}
        <div className="fixed inset-0 z-[1] bg-gradient-to-br from-black/25 via-black/15 to-black/30" />

        {/* Page Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
