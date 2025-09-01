/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const socketInstance = getSocket(sessionStorage.getItem("sessionId") || "");
    setSocket(socketInstance);

    // Listen for active room
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
      if (room) {
        socketInstance.emit("joinGameRoom", room);
      }
    });

    // Listen for game state updates
    socketInstance.on("gameStateUpdate", (newGameState: GameState) => {
      setGameState(newGameState);
    });

    // Listen for player role assignment
    socketInstance.on("playerRoleAssigned", (role: "player1" | "player2") => {
      setPlayerRole(role);
    });

    // Listen for connection updates
    socketInstance.on("connectionMade", (gameState: GameState) => {
      setGameState(gameState);
      setSelectedDot(null); // Clear selection after move
    });

    // Listen for game over
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
  }, []);

  // Check if two positions are adjacent (horizontal or vertical)
  const areAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // Check if a connection already exists
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

  // Get connection between two positions
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

  // Handle dot click
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
        // Deselect if clicking the same dot
        setSelectedDot(null);
      } else if (areAdjacent(selectedDot, position)) {
        // Try to create connection
        if (!connectionExists(selectedDot, position)) {
          // Emit move to server
          socket.emit("makeMove", {
            roomId: gameState.roomId,
            from: selectedDot,
            to: position,
            player: playerRole,
          });
        }
        setSelectedDot(null);
      } else {
        // Select new dot if not adjacent
        setSelectedDot(position);
      }
    }
  };

  // Render horizontal line (only if connection exists)
  const renderHorizontalLine = (row: number, col: number) => {
    const from = { row, col };
    const to = { row, col: col + 1 };
    const connection = getConnection(from, to);

    if (!connection) return null;

    return (
      <div
        key={`h-${row}-${col}`}
        className={`absolute w-12 h-1 ${
          connection.player === "player1" ? "bg-blue-500" : "bg-red-500"
        }`}
        style={{
          left: `${col * 60 + 20}px`,
          top: `${row * 60 + 10}px`,
        }}
      />
    );
  };

  // Render vertical line (only if connection exists)
  const renderVerticalLine = (row: number, col: number) => {
    const from = { row, col };
    const to = { row: row + 1, col };
    const connection = getConnection(from, to);

    if (!connection) return null;

    return (
      <div
        key={`v-${row}-${col}`}
        className={`absolute w-1 h-12 ${
          connection.player === "player1" ? "bg-blue-500" : "bg-red-500"
        }`}
        style={{
          left: `${col * 60 + 10}px`,
          top: `${row * 60 + 20}px`,
        }}
      />
    );
  };

  // Render completed square
  const renderCompletedSquare = (square: CompletedSquare) => {
    return (
      <div
        key={`square-${square.topLeft.row}-${square.topLeft.col}`}
        className={`absolute w-12 h-12 flex items-center justify-center text-white font-bold text-sm ${
          square.player === "player1"
            ? "bg-blue-500 bg-opacity-50"
            : "bg-red-500 bg-opacity-50"
        }`}
        style={{
          left: `${square.topLeft.col * 60 + 20}px`,
          top: `${square.topLeft.row * 60 + 20}px`,
        }}
      >
        {square.player === "player1" ? "1" : "2"}
      </div>
    );
  };

  if (loading) return <p className="text-white">Checking game session...</p>;

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2>No active game found 🚫</h2>
        <p>Go back to lobby and start a match.</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2>Loading game...</h2>
        <p>Connecting to room {roomId}</p>
      </div>
    );
  }

  const isMyTurn = gameState.currentPlayer === playerRole;
  const canPlay = gameState.gameStatus === "playing" && isMyTurn;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen backdrop-blur-0 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Dots & Boxes</h2>

      {/* Player Info */}
      <div className="flex gap-4 mb-4">
        <div
          className={`p-3 rounded-lg border-2 ${
            gameState.currentPlayer === "player1"
              ? "border-blue-400 bg-blue-900"
              : "border-blue-700 bg-blue-950"
          } ${playerRole === "player1" ? "ring-2 ring-yellow-400" : ""}`}
        >
          <div className="text-center">
            <p className="text-sm">Player 1</p>
            <p className="text-xl font-bold">{gameState.scores.player1}</p>
            {playerRole === "player1" && (
              <p className="text-xs text-yellow-400">You</p>
            )}
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border-2 ${
            gameState.currentPlayer === "player2"
              ? "border-red-400 bg-red-900"
              : "border-red-700 bg-red-950"
          } ${playerRole === "player2" ? "ring-2 ring-yellow-400" : ""}`}
        >
          <div className="text-center">
            <p className="text-sm">Player 2</p>
            <p className="text-xl font-bold">{gameState.scores.player2}</p>
            {playerRole === "player2" && (
              <p className="text-xs text-yellow-400">You</p>
            )}
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="mb-4 text-center">
        {gameState.gameStatus === "waiting" && (
          <p className="text-yellow-400">Waiting for players...</p>
        )}
        {gameState.gameStatus === "playing" && (
          <p
            className={`text-lg ${
              canPlay ? "text-green-400" : "text-gray-400"
            }`}
          >
            {canPlay
              ? "Your turn!"
              : `Player ${
                  gameState.currentPlayer === "player1" ? "1" : "2"
                }'s turn`}
          </p>
        )}
        {gameState.gameStatus === "finished" && (
          <div>
            <h3 className="text-xl font-bold text-yellow-400">Game Over!</h3>
            <p className="text-lg">
              {gameState.winner === "tie"
                ? "It's a Tie!"
                : `Player ${gameState.winner === "player1" ? "1" : "2"} Wins!`}
            </p>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="relative w-[260px] h-[260px] mt-4 mb-4 bg-black/80 backdrop-blur-xl p-2 rounded-lg">
        {/* Completed Squares */}
        {gameState.completedSquares.map((square) =>
          renderCompletedSquare(square)
        )}

        {/* Horizontal Lines (only show if connected) */}
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => renderHorizontalLine(row, col))
        )}

        {/* Vertical Lines (only show if connected) */}
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => renderVerticalLine(row, col))
        )}

        {/* Dots */}
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
        const position = { row, col };
        const isSelected =
          selectedDot && selectedDot.row === row && selectedDot.col === col;

        return (
          <button
            key={`dot-${row}-${col}`}
            className={`absolute w-5 h-5 rounded-full border-2 transition-all ${
          isSelected
                    ? "bg-yellow-400 border-yellow-300 scale-125"
                    : "bg-white border-gray-300 hover:bg-gray-200"
                } ${
                  canPlay
                    ? "cursor-pointer hover:scale-110"
                    : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  left: `${col * 60}px`,
                  top: `${row * 60}px`,
                }}
                onClick={() => handleDotClick(position)}
                disabled={!canPlay}
              />
            );
          })
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center max-w-md">
        <p className="text-sm text-gray-300 mb-2">
          {canPlay
            ? "Click on dots to select them, then click an adjacent dot to draw a line."
            : "Wait for your turn to make a move."}
        </p>
        {selectedDot && (
          <p className="text-yellow-400 text-sm">
            Selected dot at ({selectedDot.row}, {selectedDot.col})
          </p>
        )}
      </div>

      {/* Connection Status */}
      <div className="mt-4 text-xs text-gray-500">
        Status: {gameState.gameStatus} | Connections:{" "}
        {gameState.connections.length} | Squares:{" "}
        {gameState.completedSquares.length}/16
      </div>
    </div>
  );
}
