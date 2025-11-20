"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const BOARD_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

type Board = number[][];

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const emptyCells: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === 0) emptyCells.push([r, c]);
    })
  );
  if (emptyCells.length === 0) return board;
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value =
    Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

function compress(row: number[]): number[] {
  const newRow = row.filter(v => v !== 0);
  while (newRow.length < BOARD_SIZE) newRow.push(0);
  return newRow;
}

function merge(row: number[]): { mergedRow: number[]; scoreDelta: number } {
  const newRow = [...row];
  let scoreDelta = 0;
  for (let i = 0; i < BOARD_SIZE - 1; i++) {
    if (newRow[i] !== 0 && newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      newRow[i + 1] = 0;
      scoreDelta += newRow[i];
    }
  }
  return { mergedRow: compress(newRow), scoreDelta };
}

function transpose(board: Board): Board {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverse(board: Board): Board {
  return board.map(row => [...row].reverse());
}

function moveLeft(board: Board): { newBoard: Board; scoreDelta: number } {
  let scoreDelta = 0;
  const newBoard = board.map(row => {
    const compressed = compress(row);
    const { mergedRow, scoreDelta: delta } = merge(compressed);
    scoreDelta += delta;
    return mergedRow;
  });
  return { newBoard, scoreDelta };
}

function moveRight(board: Board): { newBoard: Board; scoreDelta: number } {
  const reversed = reverse(board);
  const { newBoard: moved, scoreDelta } = moveLeft(reversed);
  return { newBoard: reverse(moved), scoreDelta };
}

function moveUp(board: Board): { newBoard: Board; scoreDelta: number } {
  const transposed = transpose(board);
  const { newBoard: moved, scoreDelta } = moveLeft(transposed);
  return { newBoard: transpose(moved), scoreDelta };
}

function moveDown(board: Board): { newBoard: Board; scoreDelta: number } {
  const transposed = transpose(board);
  const { newBoard: moved, scoreDelta } = moveRight(transposed);
  return { newBoard: transpose(moved), scoreDelta };
}

function hasMoves(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c < BOARD_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < BOARD_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  useEffect(() => {
    let newBoard = addRandomTile(board);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
  }, []);

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let result;
    switch (direction) {
      case "up":
        result = moveUp(board);
        break;
      case "down":
        result = moveDown(board);
        break;
      case "left":
        result = moveLeft(board);
        break;
      case "right":
        result = moveRight(board);
        break;
    }
    const { newBoard, scoreDelta } = result;
    if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
      const updatedBoard = addRandomTile(newBoard);
      setBoard(updatedBoard);
      setScore(prev => prev + scoreDelta);
      if (!hasMoves(updatedBoard)) setGameOver(true);
    }
  };

  const tileClass = (value: number) => {
    const base = "flex items-center justify-center rounded-md text-2xl font-bold";
    const colors: Record<number, string> = {
      0: "bg-muted",
      2: "bg-blue-200",
      4: "bg-blue-300",
      8: "bg-blue-400",
      16: "bg-blue-500",
      32: "bg-blue-600",
      64: "bg-blue-700",
      128: "bg-blue-800",
      256: "bg-blue-900",
      512: "bg-indigo-200",
      1024: "bg-indigo-300",
      2048: "bg-indigo-400",
    };
    return `${base} ${colors[value] ?? "bg-indigo-500"} text-white`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex justify-end">
        <span className="text-xl font-semibold">Score: {score}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div key={i} className={tileClass(v)} style={{ width: 80, height: 80 }}>
            {v !== 0 && v}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleMove("up")}>
          <ArrowUp />
        </Button>
        <Button variant="outline" onClick={() => handleMove("left")}>
          <ArrowLeft />
        </Button>
        <Button variant="outline" onClick={() => handleMove("right")}>
          <ArrowRight />
        </Button>
        <Button variant="outline" onClick={() => handleMove("down")}>
          <ArrowDown />
        </Button>
      </div>
      {gameOver && (
        <div className="mt-4">
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
