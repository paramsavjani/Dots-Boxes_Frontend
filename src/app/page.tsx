"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (savedName) {
      router.push("/lobby");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "") return;
    localStorage.setItem("username", username.trim());
    router.push("/lobby");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute w-[300px] h-[300px] bg-purple-600 rounded-full opacity-30 animate-pulse blur-3xl -top-32 -left-32"></div>
        <div className="absolute w-[400px] h-[400px] bg-blue-500 rounded-full opacity-20 animate-pulse blur-3xl -bottom-32 -right-32"></div>
        <div className="absolute w-[500px] h-[500px] bg-pink-500 rounded-full opacity-10 animate-pulse blur-3xl top-1/4 left-1/2"></div>
      </div>

      <main className="relative z-10 flex flex-col items-center bg-black/40 backdrop-blur-md rounded-xl p-12 gap-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Loops & Squares</h1>
        <p className="text-center text-gray-300 mb-6">
          Enter your username to join the game lobby
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-72">
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded-md bg-black/50 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            className="p-3 rounded-md bg-purple-600 hover:bg-purple-700 transition text-white font-semibold"
          >
            Enter Lobby
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4">
          Your username will be stored locally for this session.
        </p>
      </main>
    </div>
  );
}
