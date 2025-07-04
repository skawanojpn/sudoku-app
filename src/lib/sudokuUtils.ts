// src/lib/sudokuUtils.ts

/**
 * 数独の盤面を型定義
 * 空白は '' とする
 */
export type SudokuGrid = (string | number)[][];

/**
 * 指定されたセルに数字を配置できるかチェックする
 * @param grid 現在の数独盤面
 * @param row 行インデックス
 * @param col 列インデックス
 * @param num 配置しようとしている数字 (文字列)
 * @returns 配置可能であれば true、そうでなければ false
 */
export const isValid = (grid: SudokuGrid, row: number, col: number, num: string): boolean => {
    // 行をチェック
    for (let x = 0; x < 9; x++) {
        if (grid[row][x]?.toString() === num) return false;
    }

    // 列をチェック
    for (let x = 0; x < 9; x++) {
        if (grid[x][col]?.toString() === num) return false;
    }

    // 3x3ボックスをチェック
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i + startRow][j + startCol]?.toString() === num) return false;
        }
    }

    return true;
};

/**
 * バックトラッキングアルゴリズムで数独を解く
 * @param grid 解く対象の数独盤面 (2D配列、参照渡しで変更される)
 * @returns 解ければ true、解けなければ false
 */
export const solveSudoku = (grid: SudokuGrid): boolean => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            // 空白セルを見つける
            if (grid[row][col] === '' || grid[row][col] === 0) {
                // 1から9までの数字を試す
                for (let num = 1; num <= 9; num++) {
                    if (isValid(grid, row, col, num.toString())) {
                        grid[row][col] = num.toString(); // 数字を配置

                        if (solveSudoku(grid)) { // 再帰的に次のセルを解く
                            return true;
                        }

                        grid[row][col] = ''; // 解けなければバックトラック (数字を元に戻す)
                    }
                }
                return false; // 1-9のどの数字も配置できない場合
            }
        }
    }
    return true; // 全てのセルが埋まった場合 (解決済み)
};

/**
 * 空の数独グリッドを生成する
 * @returns 9x9の空の数独グリッド
 */
export const createEmptySudokuGrid = (): SudokuGrid => {
    return Array(9).fill(null).map(() => Array(9).fill(''));
};

/**
 * サンプル数独グリッド
 */
export const sampleSudokuGrid: SudokuGrid = [
    ['5', '3', '', '', '7', '', '', '', ''],
    ['6', '', '', '1', '9', '5', '', '', ''],
    ['', '9', '8', '', '', '', '', '6', ''],
    ['8', '', '', '', '6', '', '', '', '3'],
    ['4', '', '', '8', '', '3', '', '', '1'],
    ['7', '', '', '', '2', '', '', '', '6'],
    ['', '6', '', '', '', '', '2', '8', ''],
    ['', '', '', '4', '1', '9', '', '', '5'],
    ['', '', '', '', '8', '', '', '7', '9']
];