/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";

interface OnlineUser {
  id: string;
  username: string;
}

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();

    const savedName =
      typeof window !== "undefined" ? localStorage.getItem("username") : null;

    if (!savedName) {
      router.push("/");
      return;
    }

    socket.emit("join", savedName);


    socket.on("userJoined", (user) => {
      console.log(`${user.username} joined!`);
      setOnlineUsers((prev) => [...prev, user]);
    });

    socket.on("userLeft", (user) => {
      console.log(`${user.username} left!`);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
    };
  }, [router]);

  async function fetchOnlineUsers() {
    const res = await fetch(
      `https://slop-dsc.duckdns.org/api/user/onlineUsers`
    );
    const js = await res.json();
    console.log(js);
    setOnlineUsers(js);
  }

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  return (
    <div className="p-6">
      <div>
        <h2>Online Users:</h2>
        <ul>
          {onlineUsers.map((user) => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
