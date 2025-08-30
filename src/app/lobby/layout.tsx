"use client";

import React, { ReactNode, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface LobbyLayoutProps {
  children: ReactNode;
}

// Particle system inspired by the SLoP design
function ParticleSystem() {
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  useEffect(() => {
    if (!particlesRef.current) return;

    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Define color palette matching the SLoP theme
    const colorPalette = [
      new THREE.Color("#ff6b6b"), // Red/coral
      new THREE.Color("#4ecdc4"), // Teal
      new THREE.Color("#45b7d1"), // Blue
      new THREE.Color("#96ceb4"), // Green
      new THREE.Color("#feca57"), // Yellow
      new THREE.Color("#ff9ff3"), // Pink
      new THREE.Color("#a8e6cf"), // Light green
    ];

    for (let i = 0; i < particleCount; i++) {
      // Position particles in 3D space
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      // Assign random colors from palette
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
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.1;

      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] +=
          Math.sin(state.clock.elapsedTime + positions[i]) * 0.01;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        ref={materialRef}
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Floating clusters similar to SLoP design
function FloatingClusters() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  const clusters: { position: [number, number, number]; color: string; count: number }[] = [
    { position: [-15, 8, -10], color: "#ff6b6b", count: 12 },
    { position: [15, -5, -8], color: "#4ecdc4", count: 15 },
    { position: [-8, -10, 5], color: "#45b7d1", count: 10 },
    { position: [12, 10, -5], color: "#feca57", count: 8 },
  ];

  return (
    <group ref={groupRef}>
      {clusters.map((cluster, clusterIndex) => (
        <group key={clusterIndex} position={cluster.position}>
          {Array.from({ length: cluster.count }).map((_, i) => (
            <Sphere
              key={i}
              position={[
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
              ]}
              color={cluster.color}
              index={i}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function Sphere({
  position,
  color,
  index,
}: {
  position: [number, number, number];
  color: string;
  index: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y +=
        Math.sin(state.clock.elapsedTime * 2 + index) * 0.005;
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.015;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshPhongMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

const LobbyLayout: React.FC<LobbyLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Three.js Background */}
      <Canvas
        className="absolute inset-0 z-2"
        camera={{ position: [0, 0, 30], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={["#000000", 20, 80]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.6}
          color="#ffffff"
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.4}
          color="#4ecdc4"
        />
        <pointLight position={[10, -10, 10]} intensity={0.4} color="#ff6b6b" />

        <ParticleSystem />
        <FloatingClusters />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.1}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.2}
        />
      </Canvas>

      {children}
    </div>
  );
};

export default LobbyLayout;
