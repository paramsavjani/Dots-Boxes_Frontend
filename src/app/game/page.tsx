/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { User, LogOut } from "lucide-react";

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showOpponentLeft, setShowOpponentLeft] = useState(false);

  // Board is 320x320, 5x5 dots -> 4 cells of 75px each, dot size 20px
  const BOARD_SIZE = 320;
  const DOTS = 5;
  const CELLS = DOTS - 1; // 4
  const CELL = 75; // px
  const DOT = 15; // px
  const DOT_RADIUS = DOT / 2;
  const LINE = 4; // px thickness for crisp lines
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
      setShowOpponentLeft(true);
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
      socketInstance.off("userLeft");
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

  function requestLeave(): void {
    setShowLeaveConfirm(true);
  }
  function confirmLeave(): void {
    socket.emit("leaveGame", roomId);
    router.push("/lobby");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      <header className="mb-4 text-center flex items-center justify-center gap-3">
        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance">
            Dots <span className="text-white/70">•</span> Boxes
          </h1>
        </div>
        <User size={22} className="text-white/80" />
      </header>

      {/* Player Info */}
      <div className="flex gap-3 sm:gap-4 mb-3 w-full max-w-lg items-stretch">
        <div
          className={`flex-1 p-3 rounded-xl border bg-white/10 backdrop-blur-sm flex items-center justify-between gap-3
            ${
              gameState.currentPlayer === "player1"
                ? "border-blue-400/40 ring-2 ring-blue-400/40"
                : "border-white/15"
            }
            ${
              playerRole === "player1"
                ? "outline outline-1 outline-yellow-400/50"
                : ""
            }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${
                gameState.currentPlayer === "player1"
                  ? "bg-blue-400 animate-pulse"
                  : "bg-white/30"
              }`}
            />
            <p className="text-xs text-white/80">{player1}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60">
              {playerRole === "player1" ? "You" : "\u00A0"}
            </p>
            <p className="text-xl font-bold leading-none">
              {gameState.scores.player1}
            </p>
          </div>
        </div>

        <div
          className={`flex-1 p-3 rounded-xl border bg-white/5 backdrop-blur-sm flex items-center justify-between gap-3
            ${
              gameState.currentPlayer === "player2"
                ? "border-blue-400/40 ring-2 ring-blue-400/40"
                : "border-white/15"
            }
            ${
              playerRole === "player2"
                ? "outline outline-1 outline-yellow-400/50"
                : ""
            }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${
                gameState.currentPlayer === "player2"
                  ? "border-blue-400/40 ring-2 ring-blue-400/40"
                  : "bg-white/30"
              }`}
            />
            <p className="text-xs text-white/80">{player2}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60">
              {playerRole === "player2" ? "You" : "\u00A0"}
            </p>
            <p className="text-xl font-bold leading-none">
              {gameState.scores.player2}
            </p>
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
        className="relative rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl"
        style={{ width: `${BOARD_SIZE + 40}px` }}
      >
        <div
          ref={boardRef}
          className="relative rounded-xl"
          style={{
            width: `${BOARD_SIZE}px`,
            height: `${BOARD_SIZE}px`,
            // keep the inner surface mostly transparent; the blur is on the wrapper
            background: "rgba(255,255,255,0)",
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
            Array.from({ length: DOTS }, (_, col) =>
              renderVerticalLine(row, col)
            )
          )}

          {/* Dots */}
          {Array.from({ length: DOTS }, (_, row) =>
            Array.from({ length: DOTS }, (_, col) => {
              const position = { row, col };
              const isSelected =
                selectedDot &&
                selectedDot.row === row &&
                selectedDot.col === col;

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
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center max-w-md">
        <p className="text-md text-white/80">
          {canPlay
            ? "Tap between two dots to draw a line."
            : "Wait for your turn to make a move."}
        </p>
      </div>

      {/* Connection Status */}
      <div className="mt-4 w-full max-w-lg">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-white/85 border border-white/15">
            Status: <span className="font-medium">{gameState.gameStatus}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-white/85 border border-white/15">
            Lines:{" "}
            <span className="font-medium">{gameState.connections.length}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-white/85 border border-white/15">
            Squares:{" "}
            <span className="font-medium">
              {gameState.completedSquares.length}/16
            </span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-white/85 border border-white/15">
            Room: <span className="font-mono">{roomId}</span>
          </span>
        </div>
      </div>

      {/* Leave Confirm Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="relative z-10 max-w-sm w-[90%] bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">
              Leave match?
            </h3>
            <p className="text-white/80 text-sm">
              You will lose your current game progress. Are you sure you want to
              leave?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="px-4 py-2 rounded-xl text-sm bg-red-500/80 hover:bg-red-500 text-white transition"
              >
                Leave match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opponent Left Modal */}
      {showOpponentLeft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 max-w-sm w-[90%] bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">
              Opponent left
            </h3>
            <p className="text-white/80 text-sm">
              The other player has left the game. Click OK to return to the
              lobby.
            </p>
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => router.push("/lobby")}
                className="px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 text-white transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.gameStatus === "finished" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 max-w-sm w-[90%] bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">Game Over</h3>
            <p className="text-white/80 text-sm">
              {gameState.winner === "tie"
                ? "It's a tie! Great game."
                : `${
                    gameState.winner === "player1"
                      ? player1 || "Player 1"
                      : player2 || "Player 2"
                  } wins!`}
            </p>
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => router.push("/lobby")}
                className="px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 text-white transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400/25 to-blue-500/25 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base leading-tight">
                    {playerRole === "player1"
                      ? player1 || "Player 1"
                      : player2 || "Player 2"}
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {canPlay ? "Your turn" : "Waiting…"}
                  </p>
                </div>
              </div>

              <button
                onClick={requestLeave}
                className="bg-white/10 hover:bg-white/15 text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Leave match</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
