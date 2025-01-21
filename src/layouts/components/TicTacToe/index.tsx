import { IconX } from "@tabler/icons-react";
import React, { useState } from "react";

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const winner = calculateWinner(board);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Tic Tac Toe</h1>

      <div className="grid grid-cols-3 gap-1">
        {board.map((cell, index) => (
          <button
            key={index}
            className="h-16 w-16 bg-white border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-200"
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {winner ? (
          <p className="text-lg font-bold text-green-600">
            {winner} hat gewonnen!
          </p>
        ) : board.every((cell) => cell) ? (
          <p className="text-lg font-bold text-blue-600">Unentschieden!</p>
        ) : (
          <p className="text-lg ">Als nächstes: {isXNext ? "X" : "O"}</p>
        )}
      </div>

      <button
        onClick={resetGame}
        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Neu starten
      </button>
    </div>
  );
};

/**
 * this function calculates the winner of the game
 */
const calculateWinner = (squares: (string | null)[]) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }

  return null;
};

export default TicTacToe;
