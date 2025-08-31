"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid"; // install uuid

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Username check state
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check username availability with debounce
  useEffect(() => {
    if (!username.trim()) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setIsAvailable(null);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/checkUsername`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim() }),
          }
        );
        setIsAvailable(res.ok);
      } catch (err) {
        console.error("Check username failed", err);
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isLoading || !isAvailable) return;

    setIsLoading(true);

    try {
      let sessionId = sessionStorage.getItem("sessionId");
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem("sessionId", sessionId);
      }
      const socket = getSocket(sessionId);

      console.log("Socket connected:", username);
      localStorage.setItem("username", username.trim());
      socket.emit("join", username.trim());
      console.log("join from handle submit");
      router.push("/lobby");
    } catch (err) {
      console.error("Registration failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  async function checkLocalStorage() {
    const sessionId = sessionStorage.getItem("sessionId");
    const username = localStorage.getItem("username");
    if (!sessionId && username) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/checkUsername`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username }),
          }
        );
        console.log(username);
        if (res.ok) {
          const sessionId = uuidv4();
          const socket = getSocket(sessionId);
          socket.connect();
          socket.emit("join", username);
          sessionStorage.setItem("sessionId", sessionId);
          router.push("/lobby");
        }
      } catch (error) {
        console.error("Check username failed", error);
      }
    }
  }

  async function checkSession() {
    const sessionId = sessionStorage.getItem("sessionId");
    if (sessionId) {
      const socket = getSocket(sessionId);
      socket.connect();
      socket.emit("join", localStorage.getItem("username"));
      router.push("/lobby");
    }
  }

  useEffect(() => {
    checkLocalStorage();
    checkSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl font-bold text-white">Loops & Squares</h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="space-y-6 relative z-10">
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-400 transition-colors">
                <User className="w-5 h-5" />
              </div>

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 text-white border border-white/10 focus:border-teal-400/40 focus:outline-none rounded-xl transition-all"
                disabled={isLoading}
                maxLength={20}
              />

              {/* Character counter */}
              {username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {username.length}/20
                </div>
              )}
            </div>

            {/* Enhanced Availability Status */}
            {username && (
              <div className="space-y-2">
                {/* Main Status Message */}
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isChecking
                      ? "bg-blue-500/10 border border-blue-400/20"
                      : isAvailable
                      ? "bg-green-500/10 border border-green-400/20"
                      : "bg-red-500/10 border border-red-400/20"
                  }`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isChecking ? (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : isAvailable ? (
                      <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Status Text */}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isChecking
                          ? "text-blue-400"
                          : isAvailable
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {isChecking
                        ? "Checking availability..."
                        : isAvailable
                        ? "Perfect! This username is available"
                        : "Oops! This username is already taken"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username.trim() || isLoading || !isAvailable}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Enter Lobby</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
