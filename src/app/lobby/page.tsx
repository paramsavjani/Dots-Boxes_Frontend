/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  Users,
  Gamepad2,
  Wifi,
  Trophy,
  Settings,
  LogOut,
  User,
  Zap,
} from "lucide-react";

interface OnlineUser {
  id: string;
  name: string;
  socketId: string;
}

let socket: Socket;

export default function Lobby() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (!savedName) {
      router.push("/");
      return;
    }
    setUsername(savedName);

    socket = io("http://localhost:3000");

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("register", savedName);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("online_users", (users: OnlineUser[]) => {
      setOnlineUsers(users.filter((u) => u.id !== socket.id));
    });

    socket.on(
      "challenge_request",
      ({ from, name }: { from: string; name: string }) => {
        const accept = window.confirm(
          `🎮 ${name} has challenged you to play. Accept?`
        );
        if (accept) {
          socket.emit("accept_challenge", { challengerId: from });
          setChallengeStatus("Accepting challenge...");
        }
      }
    );

    socket.on("match_start", ({ id }) => {
      setChallengeStatus("Match starting...");
      setTimeout(() => {
        router.push(`/game/loops-boxes?roomId=${id}`);
      }, 1000);
    });

    return () => {
      socket?.disconnect();
    };
  }, [router]);

  const challengeUser = (user: OnlineUser) => {
    socket.emit("challenge_user", { targetId: user.id });
    setChallengeStatus(`Challenge sent to ${user.name}...`);
    setTimeout(() => setChallengeStatus(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    socket?.disconnect();
    router.push("/");
  };

  return <>hiiii</>;
}
