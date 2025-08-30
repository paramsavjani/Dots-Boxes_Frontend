/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { User, LogOut, Users, Gamepad2 } from "lucide-react";

interface OnlineUser {
  id: string;
  username: string;
}

export default function Lobby() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [username, setUsername] = useState<string>("");
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const sessionId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sessionId")
        : null;

    if (!sessionId) {
      router.push("/");
      return;
    }
    setSessionId(() => sessionId);

    const savedUsername = localStorage.getItem("username");
    setUsername(savedUsername || "");

    const socket = getSocket(sessionId);
    socket.emit("join", savedUsername);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, [router]);

  async function fetchOnlineUsers() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/onlineUsers`
      );
      const js = await res.json();
      setOnlineUsers(js);
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  }

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  const handleChangeUsername = () => {
    const socket = getSocket(sessionId);
    socket.disconnect();
    localStorage.removeItem("username");
    sessionStorage.removeItem("sessionId");
    router.push("/");
  };

  const otherUsers = onlineUsers.filter((user) => username !== user.username);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Center Content */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-black/50 backdrop-blur-md rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Online Players
              </h2>
              <p className="text-gray-400 text-xs">
                {otherUsers.length}{" "}
                {otherUsers.length === 1 ? "player" : "players"} ready to battle
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {otherUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400/10 to-gray-500/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Lobby is empty</p>
                <p className="text-gray-500 text-xs">
                  Invite friends to start playing!
                </p>
              </div>
            ) : (
              otherUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white/3 hover:bg-white/8 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {user.username}
                      </p>
                      <p className="text-gray-400 text-xs">Online</p>
                    </div>
                  </div>

                  <button className="bg-teal-400/15 hover:bg-teal-400/25 text-teal-400 px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium">
                    <Gamepad2 className="w-3 h-3" />
                    Challenge
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Profile Info - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl p-4 m-4 rounded-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{username}</h3>
              <p className="text-gray-400 text-xs">Ready to play</p>
            </div>
          </div>

          <button
            onClick={handleChangeUsername}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Change
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
