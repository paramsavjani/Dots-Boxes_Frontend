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
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const sessionId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sessionId")
        : null;

    if (sessionId === null) {
      router.push("/");
      return;
    }

    const savedUsername = localStorage.getItem("username");
    setUsername(() => localStorage.getItem("username") || "");

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

  useEffect(() => {
    console.log(onlineUsers);
  }, [onlineUsers]);

  return (
    <div className="p-6">
      <div>
        <h2>Online Users:</h2>
        <ul>
          {onlineUsers
            .filter((user) => username !== user.username)
            .map((user) => (
              <li key={user.username}>{user.username}</li>
            ))}
        </ul>
      </div>
    </div>
  );
}
