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

  return (
    <></>
    // <div className="relative z-10 min-h-screen flex items-center blur-0 justify-center p-6">
    //   <div className="w-full max-w-5xl">
    //     {/* Header Section */}
    //     <div className="text-center mb-10">
    //       <div className="inline-flex items-center gap-4 mb-6">
    //         <div className="relative">
    //           <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
    //             <Gamepad2 className="w-8 h-8 text-white" />
    //           </div>
    //           <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
    //         </div>
    //         <div>
    //           <h1 className="text-6xl font-bold text-white mb-2">
    //             Loops & Squares
    //           </h1>
    //           <p className="text-gray-400 text-lg">Game Lobby</p>
    //         </div>
    //       </div>

    //       {/* User Status Card */}
    //       <div className="inline-flex items-center gap-4 bg-black/30 backdrop-blur-xl rounded-2xl px-8 py-4 border border-white/10 shadow-2xl">
    //         <div className="flex items-center gap-3">
    //           <div className="relative">
    //             <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
    //               <User className="w-6 h-6 text-white" />
    //             </div>
    //             <div
    //               className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
    //                 isConnected ? "bg-green-400" : "bg-red-400"
    //               } ${isConnected ? "animate-pulse" : ""}`}
    //             />
    //           </div>
    //           <div className="text-left">
    //             <h3 className="text-white font-semibold text-lg">{username}</h3>
    //             <p className="text-gray-400 text-sm flex items-center gap-2">
    //               <Wifi className="w-3 h-3" />
    //               {isConnected ? "Connected" : "Connecting..."}
    //             </p>
    //           </div>
    //         </div>

    //         <button
    //           onClick={handleLogout}
    //           className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
    //           title="Logout"
    //         >
    //           <LogOut className="w-5 h-5" />
    //         </button>
    //       </div>
    //     </div>

    //     {/* Challenge Status */}
    //     {challengeStatus && (
    //       <div className="text-center mb-8">
    //         <div className="inline-flex items-center gap-3 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl px-6 py-3 shadow-lg">
    //           <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
    //           <span className="text-yellow-200 font-medium">
    //             {challengeStatus}
    //           </span>
    //         </div>
    //       </div>
    //     )}

    //     {/* Main Content Panel */}
    //     <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
    //       <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 px-8 py-6 border-b border-white/10">
    //         <div className="flex items-center justify-between">
    //           <div className="flex items-center gap-3">
    //             <Users className="w-6 h-6 text-teal-400" />
    //             <h2 className="text-2xl font-bold text-white">
    //               Online Players
    //             </h2>
    //           </div>
    //           <div className="flex items-center gap-2 bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full text-sm font-medium border border-teal-500/30">
    //             <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
    //             {onlineUsers.length} online
    //           </div>
    //         </div>
    //       </div>

    //       <div className="p-8">
    //         {onlineUsers.length === 0 ? (
    //           <div className="text-center py-16">
    //             <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
    //               <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full animate-pulse opacity-50" />
    //               <div className="relative w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
    //                 <Wifi className="w-8 h-8 text-gray-400" />
    //               </div>
    //             </div>
    //             <h3 className="text-white text-xl font-semibold mb-2">
    //               Waiting for Players
    //             </h3>
    //             <p className="text-gray-400">
    //               No other players online right now
    //             </p>
    //             <p className="text-gray-500 text-sm mt-2">
    //               Share the lobby link with friends to play together!
    //             </p>
    //           </div>
    //         ) : (
    //           <div className="grid gap-4">
    //             {onlineUsers.map((user, index) => (
    //               <div
    //                 key={user.id}
    //                 className="group relative overflow-hidden"
    //                 style={{
    //                   animation: `slideInUp 0.6s ease-out ${
    //                     index * 150
    //                   }ms both`,
    //                 }}
    //               >
    //                 {/* Card Background */}
    //                 <div className="relative bg-white/5 hover:bg-white/10 rounded-2xl p-6 border border-white/10 hover:border-teal-400/30 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/10">
    //                   {/* Gradient Border Effect */}
    //                   <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

    //                   <div className="flex items-center justify-between">
    //                     <div className="flex items-center gap-4">
    //                       {/* Enhanced Avatar */}
    //                       <div className="relative">
    //                         <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-teal-500/25 transition-all duration-300">
    //                           <span className="text-white font-bold text-xl">
    //                             {user.name.charAt(0).toUpperCase()}
    //                           </span>
    //                         </div>
    //                         <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-black animate-pulse" />
    //                         <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300" />
    //                       </div>

    //                       {/* User Info */}
    //                       <div>
    //                         <h3 className="text-white font-semibold text-xl group-hover:text-teal-300 transition-colors duration-300">
    //                           {user.name}
    //                         </h3>
    //                         <div className="flex items-center gap-2 text-gray-400 text-sm">
    //                           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
    //                           Ready to play
    //                         </div>
    //                       </div>
    //                     </div>

    //                     {/* Challenge Button */}
    //                     <button
    //                       onClick={() => challengeUser(user)}
    //                       className="group/btn relative bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-teal-500/25 flex items-center gap-3"
    //                     >
    //                       <Trophy className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
    //                       <span>Challenge</span>

    //                       {/* Button Glow Effect */}
    //                       <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-400 rounded-xl opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 blur-xl" />
    //                     </button>
    //                   </div>
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         )}
    //       </div>
    //     </div>

    //     {/* Footer Actions */}
    //     <div className="flex justify-center gap-4 mt-8">
    //       <button className="flex items-center gap-2 bg-black/30 hover:bg-black/50 backdrop-blur-xl text-white px-6 py-3 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30 shadow-lg">
    //         <Settings className="w-4 h-4" />
    //         Settings
    //       </button>
    //     </div>
    //   </div>

    //   <style jsx>{`
    //     @keyframes slideInUp {
    //       from {
    //         opacity: 0;
    //         transform: translateY(40px) scale(0.95);
    //       }
    //       to {
    //         opacity: 1;
    //         transform: translateY(0) scale(1);
    //       }
    //     }
    //   `}</style>
    // </div>
  );
}
