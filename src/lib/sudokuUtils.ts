// src/lib/sudokuUtils.ts

// 数独グリッドの型定義: 9x9の文字列の配列
// 各セルは数字の文字列 ('1'〜'9') または空文字列 ('') を保持します。
export type SudokuGrid = string[][];

/**
 * 空の数独グリッドを作成します。
 * 各セルは空文字列で初期化されます。
 * @returns 9x9の空の数独グリッド
 */
export const createEmptySudokuGrid = (): SudokuGrid => {
  return Array(9).fill(null).map(() => Array(9).fill(''));
};

// 必要に応じて、他の数独関連のユーティリティ関数をここに追加できます。
// 例:
// export const isValidSudoku = (grid: SudokuGrid): boolean => { ... };
// export const solveSudoku = (grid: SudokuGrid): SudokuGrid | null => { ... };
