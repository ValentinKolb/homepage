import { createSignal, createMemo, For, Show } from "solid-js";

const TicTacToe = () => {
  const [board, setBoard] = createSignal(Array(9).fill(null));
  const [isXNext, setIsXNext] = createSignal(true);

  const winner = createMemo(() => calculateWinner(board()));

  const handleClick = (index: number) => {
    if (board()[index] || winner()) return;

    const newBoard = [...board()];
    newBoard[index] = isXNext() ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext());
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div class="flex flex-col items-center justify-center rounded-lg bg-gray-100 p-4">
      <h1 class="mb-4 text-2xl font-bold">Tic Tac Toe</h1>

      <div class="grid grid-cols-3 gap-1">
        <For each={board()}>
          {(cell, index) => (
            <button
              class="flex h-16 w-16 items-center justify-center border border-gray-300 bg-white text-xl font-bold hover:bg-gray-200"
              onClick={() => handleClick(index())}
            >
              {cell}
            </button>
          )}
        </For>
      </div>

      <div class="mt-4">
        <Show when={winner()}>
          <p class="text-lg font-bold text-green-600">
            {winner()} hat gewonnen!
          </p>
        </Show>
        <Show when={!winner() && board().every((cell) => cell)}>
          <p class="text-lg font-bold text-blue-600">Unentschieden!</p>
        </Show>
        <Show when={!winner() && !board().every((cell) => cell)}>
          <p class="text-lg">Als nächstes: {isXNext() ? "X" : "O"}</p>
        </Show>
      </div>

      <button
        onClick={resetGame}
        class="mt-4 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
      >
        Neu starten
      </button>
    </div>
  );
};

/**
 * Diese Funktion berechnet den Gewinner des Spiels
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
