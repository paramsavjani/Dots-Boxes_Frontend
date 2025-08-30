"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Note: localStorage usage should be replaced with in-memory storage for Claude artifacts
    const savedName =
      typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (savedName) {
      router.push("/lobby");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "") return;

    setIsLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("username", username.trim());
    }

    setTimeout(() => {
      router.push("/lobby");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Enhanced Welcome Section */}
        <div className="text-center mb-8 sm:mb-12 relative">
          {/* Floating decorative elements */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24"></div>

          <div className="relative mt-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white via-teal-100 to-blue-100 bg-clip-text text-transparent drop-shadow-2xl">
                Loops
              </span>
              <span className="text-white/90 mx-2">&</span>
              <span className="bg-gradient-to-r from-blue-100 via-teal-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                Squares
              </span>
            </h1>

            {/* Animated underline */}
            <div className="mx-auto w-24 sm:w-32 h-1 bg-gradient-to-r from-teal-400/60 to-blue-400/60 rounded-full">
              <div className="h-full bg-gradient-to-r from-teal-400 to-blue-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Ultra-transparent Login Form */}
        <div className="bg-black-20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 rounded-2xl sm:rounded-3xl" />

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Enhanced Username Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-teal-400 transition-colors duration-300 z-10">
                <User className="w-5 h-5" />
              </div>

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-12 pr-4 py-4 sm:py-5 bg-white/5 backdrop-blur-2xl text-white placeholder-gray-400 border border-white/10 focus:border-teal-400/40 focus:outline-none rounded-xl sm:rounded-2xl transition-all duration-500 text-base sm:text-lg font-medium shadow-inner relative z-10"
                disabled={isLoading}
                maxLength={20}
              />

              {/* Character counter */}
              {username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {username.length}/20
                </div>
              )}
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="group relative w-full bg-white/8 hover:bg-white/12 backdrop-blur-2xl disabled:bg-white/3 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all duration-500 transform hover:scale-[1.02] disabled:scale-100 shadow-lg border border-white/15 hover:border-teal-400/30 disabled:border-white/8 flex items-center justify-center gap-3 overflow-hidden"
            >
              {/* Animated background gradient */}

              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entering Lobby...</span>
                </>
              ) : (
                <>
                  <span>Enter Lobby</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}

              {/* Enhanced button glow */}
            </button>
          </form>

          {/* Enhanced Info Text */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-400/80 text-xs sm:text-sm font-light">
              Your username will be stored locally for this session
            </p>
          </div>
        </div>

        {/* Mobile-specific bottom spacing */}
        <div className="h-8 sm:h-0" />
      </div>
    </div>
  );
}
