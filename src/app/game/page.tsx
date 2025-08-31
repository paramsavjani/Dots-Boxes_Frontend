"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export default function GamePage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket(sessionStorage.getItem("sessionId") || "");

    const username = localStorage.getItem("username") || "";
    socket.emit("join", username.trim());
    socket.emit("checkActiveRoom");

    // listen for server response
    socket.on("activeRoom", (room: string | null) => {
      setRoomId(room);
      setLoading(false);
    });

    return () => {
      socket.off("activeRoom");
    };
  }, []);

  if (loading) return <p className="text-white">Checking game session...</p>;

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2>No active game found 🚫</h2>
        <p>Go back to lobby and start a match.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <h2 className="text-xl font-bold">Game Room: {roomId}</h2>
      {/* Here goes your actual game board */}
      <div className="mt-6 w-[400px] h-[400px] bg-slate-800 flex items-center justify-center">
        🎮 Game running...
      </div>
    </div>
  );
}
