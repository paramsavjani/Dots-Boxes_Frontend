/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { User, LogOut, Users, RefreshCw } from "lucide-react";

interface OnlineUser {
  socketId: string;
  username: string;
  sessionId: string;
}

export default function Lobby() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sid = sessionStorage.getItem("sessionId");
    const savedUsername = localStorage.getItem("username") ?? "";

    if (!sid) {
      router.push("/");
      return;
    }

    setSessionId(sid);
    setUsername(savedUsername);

    const socket = getSocket(sid);
    socket.emit("join", savedUsername);

    socket.on("onlineUsers", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on("receiveFriendRequest", (username: string) => {
      console.log(`Friend request received from ${username}`);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, [router]);

  const sendRequest = (socketId: string) => {
    const socket = getSocket(sessionId);
    socket.emit("sendFriendRequest", socketId);
  };

  const fetchOnlineUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/onlineUsers`
      );
      if (res.ok) {
        const js = await res.json();
        setOnlineUsers(js);
      }
    } catch (err) {
      console.error("Failed to fetch online users:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  const handleChangeUsername = () => {
    getSocket(sessionId).disconnect();
    localStorage.removeItem("username");
    sessionStorage.removeItem("sessionId");
    router.push("/");
  };

  const otherUsers = onlineUsers.filter((u) => u.username !== username);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Center Content */}
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400/25 to-emerald-500/25 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Online Players
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {otherUsers.length}{" "}
                    {otherUsers.length === 1 ? "player" : "players"} online
                  </p>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchOnlineUsers}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              >
                <RefreshCw
                  className={`w-5 h-5 text-white ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto custom-scrollbar">
              {otherUsers.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400/15 to-gray-500/15 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-300 text-lg font-medium mb-1">
                    Lobby is quiet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Invite friends to start the battle!
                  </p>
                </div>
              ) : (
                otherUsers.map((user) => (
                  <div
                    key={user.socketId}
                    className="flex items-center justify-between p-4 bg-black/25 hover:bg-black/35 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-teal-400/25 to-blue-500/25 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-300" />
                      </div>
                      <p className="text-white font-semibold text-base">
                        {user.username}
                      </p>
                    </div>

                    <button
                      onClick={() => sendRequest(user.socketId)}
                      className="bg-gradient-to-r from-teal-400/20 to-blue-400/20 hover:from-teal-400/30 hover:to-blue-400/30 text-teal-300 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold border border-teal-400/20 hover:border-teal-400/40 shadow-lg"
                    >
                      Challenge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Bar - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400/25 to-blue-500/25 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {username}
                  </h3>
                  <p className="text-gray-400 text-xs">Ready to play</p>
                </div>
              </div>

              <button
                onClick={handleChangeUsername}
                className="bg-white/8 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Change</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
}
