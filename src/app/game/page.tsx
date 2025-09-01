/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";

// Types
interface Position {
  row: number;
  col: number;
}

interface Connection {
  from: Position;
  to: Position;
  player: "player1" | "player2";
  timestamp: number;
}

interface CompletedSquare {
  topLeft: Position;
  player: "player1" | "player2";
  completedAt: number;
}

interface GameState {
  roomId: string;
  connections: Connection[];
  completedSquares: CompletedSquare[];
  currentPlayer: "player1" | "player2";
  scores: {
    player1: number;
    player2: number;
  };
  gameStatus: "waiting" | "playing" | "finished";
  players: {
    player1?: {
      id: string;
      name: string;
      connected: boolean;
    };
    player2?: {
      id: string;
      name: string;
      connected: boolean;
    };
  };
  createdAt: number;
  lastMove: number;
  winner?: "player1" | "player2" | "tie";
}

export default function GamePage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedDot, setSelectedDot] = useState<Position | null>(null);
  const [playerRole, setPlayerRole] = useState<"player1" | "player2" | null>(
    null
  );
  const [socket, setSocket] = useState<any>(null);
  const router = useRouter();
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");

  // Board is 260x260, 5x5 dots -> 4 cells of 60px each, dot size 20px
  const BOARD_SIZE = 260;
  const DOTS = 5;
  const CELLS = DOTS - 1; // 4
  const CELL = 60; // px
  const DOT = 20; // px
  const DOT_RADIUS = DOT / 2;
  const LINE = 3; // px thickness for crisp lines
  const GAP = CELL - DOT; // space between adjacent dots' edges = 40

  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socketInstance = getSocket(sessionStorage.getItem("sessionId") || "");
    setSocket(socketInstance);

    socketInstance.emit("checkActiveRoom");

    socketInstance.on("activeRoom", (room: string | null) => {
      if (room === null) {
        if (sessionStorage.getItem("sessionId")) {
          router.push("/lobby");
        } else {
          router.push("/");
        }
      }
      setRoomId(room);
      setLoading(false);
    });

    socketInstance.on("gameStateUpdate", (newGameState: GameState) => {
      setPlayer1(newGameState.players.player1?.name || "Player 1");
      setPlayer2(newGameState.players.player2?.name || "Player 2");
      setGameState(newGameState);
    });

    socketInstance.on("playerRoleAssigned", (role: "player1" | "player2") => {
      setPlayerRole(role);
    });

    socketInstance.on("connectionMade", (gs: GameState) => {
      setGameState(gs);
      setSelectedDot(null);
    });

    socketInstance.on("userLeft", () => {
      alert(
        "The other player has left the game. You will be redirected to the lobby."
      );
      router.push("/lobby");
    });

    socketInstance.on("gameFinished", (finalGameState: GameState) => {
      setGameState(finalGameState);
    });

    return () => {
      socketInstance.off("activeRoom");
      socketInstance.off("gameStateUpdate");
      socketInstance.off("playerRoleAssigned");
      socketInstance.off("connectionMade");
      socketInstance.off("gameFinished");
    };
  }, [router]);

  // Helpers
  const areAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const connectionExists = (from: Position, to: Position): boolean => {
    if (!gameState) return false;
    return gameState.connections.some(
      (conn) =>
        (conn.from.row === from.row &&
          conn.from.col === from.col &&
          conn.to.row === to.row &&
          conn.to.col === to.col) ||
        (conn.from.row === to.row &&
          conn.from.col === to.col &&
          conn.to.row === from.row &&
          conn.to.col === from.col)
    );
  };

  const getConnection = (from: Position, to: Position): Connection | null => {
    if (!gameState) return null;
    return (
      gameState.connections.find(
        (conn) =>
          (conn.from.row === from.row &&
            conn.from.col === from.col &&
            conn.to.row === to.row &&
            conn.to.col === to.col) ||
          (conn.from.row === to.row &&
            conn.from.col === to.col &&
            conn.to.row === from.row &&
            conn.to.col === from.col)
      ) || null
    );
  };

  const emitMove = (from: Position, to: Position) => {
    if (!gameState || !playerRole || !socket) return;
    if (gameState.gameStatus !== "playing") return;
    if (gameState.currentPlayer !== playerRole) return;
    if (!areAdjacent(from, to)) return;
    if (connectionExists(from, to)) return;

    socket.emit("makeMove", {
      roomId: gameState.roomId,
      from,
      to,
      player: playerRole,
    });
  };

  // Dot/tap click flow remains (tap two adjacent dots)
  const handleDotClick = (position: Position) => {
    if (!gameState || !playerRole || !socket) return;
    if (gameState.gameStatus !== "playing") return;
    if (gameState.currentPlayer !== playerRole) return;

    if (!selectedDot) {
      setSelectedDot(position);
    } else {
      if (
        selectedDot.row === position.row &&
        selectedDot.col === position.col
      ) {
        setSelectedDot(null);
      } else if (areAdjacent(selectedDot, position)) {
        emitMove(selectedDot, position);
        setSelectedDot(null);
      } else {
        setSelectedDot(position);
      }
    }
  };

  const handleBoardPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gameState || !playerRole || !socket) return;
    if (gameState.gameStatus !== "playing") return;
    if (gameState.currentPlayer !== playerRole) return;

    // Ignore if directly interacting with a dot button (so existing behavior stays)
    const t = e.target as HTMLElement;
    if (t && (t.tagName === "BUTTON" || t.closest("button"))) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Hit slop around lines in px
    const HIT = 12;

    type EdgeHit = {
      from: Position;
      to: Position;
      dist2: number;
    };

    const candidates: EdgeHit[] = [];

    // Horizontal edges
    for (let row = 0; row < DOTS; row++) {
      for (let col = 0; col < CELLS; col++) {
        const xStart = col * CELL + DOT;
        const xEnd = (col + 1) * CELL;
        const yLine = row * CELL + DOT_RADIUS;

        const withinRect =
          x >= xStart - HIT &&
          x <= xEnd + HIT &&
          y >= yLine - HIT &&
          y <= yLine + HIT;

        if (withinRect) {
          // distance squared to center for tie-breaking
          const cx = (xStart + xEnd) / 2;
          const cy = yLine;
          const dx = x - cx;
          const dy = y - cy;
          candidates.push({
            from: { row, col },
            to: { row, col: col + 1 },
            dist2: dx * dx + dy * dy,
          });
        }
      }
    }

    // Vertical edges
    for (let row = 0; row < CELLS; row++) {
      for (let col = 0; col < DOTS; col++) {
        const xLine = col * CELL + DOT_RADIUS;
        const yStart = row * CELL + DOT;
        const yEnd = (row + 1) * CELL;

        const withinRect =
          x >= xLine - HIT &&
          x <= xLine + HIT &&
          y >= yStart - HIT &&
          y <= yEnd + HIT;

        if (withinRect) {
          const cx = xLine;
          const cy = (yStart + yEnd) / 2;
          const dx = x - cx;
          const dy = y - cy;
          candidates.push({
            from: { row, col },
            to: { row: row + 1, col },
            dist2: dx * dx + dy * dy,
          });
        }
      }
    }

    if (candidates.length === 0) return;

    // Pick nearest edge center
    candidates.sort((a, b) => a.dist2 - b.dist2);
    const { from, to } = candidates[0];

    if (!connectionExists(from, to)) {
      emitMove(from, to);
    }
  };

  const renderHorizontalLine = (row: number, col: number) => {
    const from = { row, col };
    const to = { row, col: col + 1 };
    const connection = getConnection(from, to);
    if (!connection) return null;

    return (
      <div
        key={`h-${row}-${col}`}
        className={`absolute ${
          connection.player === "player1" ? "bg-blue-500" : "bg-red-500"
        }`}
        style={{
          left: `${col * CELL + DOT}px`,
          top: `${row * CELL + DOT_RADIUS - Math.floor(LINE / 2)}px`,
          width: `${GAP}px`,
          height: `${LINE}px`,
          borderRadius: "9999px",
          boxShadow: "0 0 0.5px rgba(255,255,255,0.1)",
        }}
      />
    );
  };

  const renderVerticalLine = (row: number, col: number) => {
    const from = { row, col };
    const to = { row: row + 1, col };
    const connection = getConnection(from, to);
    if (!connection) return null;

    return (
      <div
        key={`v-${row}-${col}`}
        className={`absolute ${
          connection.player === "player1" ? "bg-blue-500" : "bg-red-500"
        }`}
        style={{
          left: `${col * CELL + DOT_RADIUS - Math.floor(LINE / 2)}px`,
          top: `${row * CELL + DOT}px`,
          width: `${LINE}px`,
          height: `${GAP}px`,
          borderRadius: "9999px",
          boxShadow: "0 0 0.5px rgba(255,255,255,0.1)",
        }}
      />
    );
  };

  const renderCompletedSquare = (square: CompletedSquare) => {
    return (
      <div
        key={`square-${square.topLeft.row}-${square.topLeft.col}`}
        className={`absolute flex items-center justify-center text-white font-semibold text-sm`}
        style={{
          left: `${square.topLeft.col * CELL + DOT}px`,
          top: `${square.topLeft.row * CELL + DOT}px`,
          width: `${GAP}px`,
          height: `${GAP}px`,
          borderRadius: "8px",
          background:
            square.player === "player1"
              ? "rgba(59,130,246,0.22)" // blue-500 @ ~22%
              : "rgba(239,68,68,0.22)", // red-500 @ ~22%
          backdropFilter: "blur(2px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-label={`Square owned by ${
          square.player === "player1"
            ? player1 || "Player 1"
            : player2 || "Player 2"
        }`}
      >
        {square.player === "player1" ? "1" : "2"}
      </div>
    );
  };

  if (loading) return <p className="text-white/80">Checking game session...</p>;

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2 className="text-xl font-semibold">No active game found</h2>
        <p className="text-sm text-white/70">
          Go back to lobby and start a match.
        </p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2 className="text-xl font-semibold">Loading game...</h2>
        <p className="text-sm text-white/70">Connecting to room {roomId}</p>
      </div>
    );
  }

  const isMyTurn = gameState.currentPlayer === playerRole;
  const canPlay = gameState.gameStatus === "playing" && isMyTurn;

  function leave(): void {
    socket.emit("leaveGame", roomId);
    router.push("/lobby");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
          Dots & Boxes
        </h1>
      </header>

      {/* Player Info */}
      <div className="flex gap-4 mb-3">
        <div
          className={`p-3 rounded-xl border bg-white/5 backdrop-blur-sm ${
            gameState.currentPlayer === "player1"
              ? "border-blue-400/40 ring-2 ring-blue-400/40"
              : "border-white/15"
          } ${
            playerRole === "player1"
              ? "outline outline-1 outline-yellow-400/50"
              : ""
          }`}
        >
          <div className="text-center">
            <p className="text-xs text-white/80">{player1}</p>
            <p className="text-xl font-bold">{gameState.scores.player1}</p>
            {playerRole === "player1" && (
              <p className="text-[10px] text-yellow-300/90">You</p>
            )}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border bg-white/5 backdrop-blur-sm ${
            gameState.currentPlayer === "player2"
              ? "border-red-400/40 ring-2 ring-red-400/40"
              : "border-white/15"
          } ${
            playerRole === "player2"
              ? "outline outline-1 outline-yellow-400/50"
              : ""
          }`}
        >
          <div className="text-center">
            <p className="text-xs text-white/80">{player2}</p>
            <p className="text-xl font-bold">{gameState.scores.player2}</p>
            {playerRole === "player2" && (
              <p className="text-[10px] text-yellow-300/90">You</p>
            )}
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="mb-3 text-center">
        {gameState.gameStatus === "waiting" && (
          <p className="text-yellow-300">Waiting for players…</p>
        )}
        {gameState.gameStatus === "playing" && (
          <p
            className={`text-sm ${
              canPlay ? "text-emerald-300" : "text-white/60"
            }`}
          >
            {canPlay
              ? "Your turn!"
              : `${
                  gameState.currentPlayer === "player1" ? player1 : player2
                }'s turn`}
          </p>
        )}
        {gameState.gameStatus === "finished" && (
          <div>
            <h3 className="text-lg font-bold text-yellow-300 drop-shadow">
              Game Over!
            </h3>
            <p className="text-sm">
              {gameState.winner === "tie"
                ? "It's a Tie!"
                : `Player ${gameState.winner === "player1" ? "1" : "2"} Wins!`}
            </p>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative rounded-2xl"
        style={{
          width: `${BOARD_SIZE}px`,
          height: `${BOARD_SIZE}px`,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.25)",
        }}
        onPointerDown={handleBoardPointer}
      >
        {/* Completed Squares */}
        {gameState.completedSquares.map((square) =>
          renderCompletedSquare(square)
        )}

        {/* Horizontal Lines */}
        {Array.from({ length: DOTS }, (_, row) =>
          Array.from({ length: CELLS }, (_, col) =>
            renderHorizontalLine(row, col)
          )
        )}

        {/* Vertical Lines */}
        {Array.from({ length: CELLS }, (_, row) =>
          Array.from({ length: DOTS }, (_, col) => renderVerticalLine(row, col))
        )}

        {/* Dots */}
        {Array.from({ length: DOTS }, (_, row) =>
          Array.from({ length: DOTS }, (_, col) => {
            const position = { row, col };
            const isSelected =
              selectedDot && selectedDot.row === row && selectedDot.col === col;

            return (
              <button
                key={`dot-${row}-${col}`}
                aria-label={`Grid dot ${row + 1},${col + 1}`}
                className={`absolute rounded-full border transition-transform will-change-transform
                  ${
                    isSelected
                      ? "bg-yellow-300 border-yellow-200 scale-125"
                      : "bg-white border-white/60 hover:bg-white/90"
                  }
                  ${
                    canPlay
                      ? "cursor-pointer hover:scale-110"
                      : "cursor-not-allowed opacity-70"
                  }
                `}
                style={{
                  width: `${DOT}px`,
                  height: `${DOT}px`,
                  left: `${col * CELL}px`,
                  top: `${row * CELL}px`,
                  boxShadow: isSelected
                    ? "0 0 12px rgba(250,204,21,0.5)"
                    : "0 0 6px rgba(255,255,255,0.25)",
                }}
                onClick={() => handleDotClick(position)}
                disabled={!canPlay}
              />
            );
          })
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center max-w-md">
        <p className="text-xs text-white/70">
          {canPlay
            ? "Tap a dot then an adjacent dot, or tap between two dots to draw a line."
            : "Wait for your turn to make a move."}
        </p>
      </div>

      {/* Connection Status */}
      <div className="mt-3 text-[11px] text-white/50">
        Status: {gameState.gameStatus} | Connections:{" "}
        {gameState.connections.length} | Squares:{" "}
        {gameState.completedSquares.length}/16
      </div>

      <div className="mt-2">
        <button
          onClick={leave}
          className="text-xs text-white/80 hover:text-white underline underline-offset-2"
        >
          Leave match
        </button>
      </div>
    </div>
  );
}
