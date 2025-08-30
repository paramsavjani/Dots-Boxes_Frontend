import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(sessionId: string) {
  if (!socket) {


    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
      withCredentials: true,
      query: { sessionId },
    });
  }
  return socket;
}
