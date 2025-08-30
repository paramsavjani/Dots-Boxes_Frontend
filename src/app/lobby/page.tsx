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

  async function checkAnyOtherUserIsThere() {
    const savedName =
      typeof window !== "undefined" ? localStorage.getItem("username") : null;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/checkUsername`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: savedName }),
      }
    );

    if (!savedName || !res.ok) {
      router.push("/");
      return;
    }
  }

  useEffect(() => {

    const savedName =
    typeof window !== "undefined" ? localStorage.getItem("username") : null;

    checkAnyOtherUserIsThere();

    if (savedName === null) return;

    const socket = getSocket(savedName);
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/onlineUsers`
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
