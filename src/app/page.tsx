"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (savedName) {
      router.push("/lobby");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "") return;

    setIsLoading(true);
    localStorage.setItem("username", username.trim());

    setTimeout(() => {
      router.push("/lobby");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Loops & Squares
          </h1>
        </div>

        {/* Login Form */}
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/30 backdrop-blur-xl text-white placeholder-gray-400 border border-white/20 focus:border-teal-400/50 focus:outline-none rounded-xl transition-all duration-300 text-lg font-medium"
                disabled={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="group relative w-full bg-white/10 hover:bg-white/20 backdrop-blur-xl disabled:bg-white/5 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg border border-white/20 hover:border-teal-400/50 disabled:border-white/10 flex items-center justify-center gap-3"
            >
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

              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-blue-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" />
            </button>
          </form>

          {/* Info Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Your username will be stored locally for this session
          </p>
        </div>
      </div>
    </div>
  );
}
