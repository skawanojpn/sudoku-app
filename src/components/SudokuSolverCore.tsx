// src/components/SudokuSolverCore.tsx
import React, { useState, useCallback } from 'react';
import { solveSudoku, createEmptySudokuGrid, sampleSudokuGrid, SudokuGrid as GridType } from '@/lib/sudokuUtils';
import SudokuGrid from './SudokuGrid';
import { Button } from '@/components/ui/button'; // shadcn/uiのButtonをインポート

interface SudokuSolverCoreProps {
  initialGrid?: GridType;
  onSolve?: (solvedGrid: GridType) => void;
  onClear?: () => void;
  onSample?: (sampleGrid: GridType) => void;
  language: 'ja' | 'en';
}

const SudokuSolverCore: React.FC<SudokuSolverCoreProps> = ({
  initialGrid = createEmptySudokuGrid(),
  onSolve,
  onClear,
  onSample,
  language,
}) => {
  const [grid, setGrid] = useState<GridType>(initialGrid);
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number]>([0, 0]);

  // 言語リソース
  const texts = {
    ja: {
      solving: '解いています...',
      solve: '解く',
      clear: 'クリア',
      sample: 'サンプル問題',
      solved: '🎉 数独が解けました！',
      unsolvable: 'この数独は解けません。入力を確認してください。',
    },
    en: {
      solving: 'Solving...',
      solve: 'Solve',
      clear: 'Clear',
      sample: 'Sample',
      solved: '🎉 Sudoku solved!',
      unsolvable: 'This Sudoku cannot be solved. Please check your input.',
    }
  };
  const t = texts[language];

  // セルの値を変更する
  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    if (value === '' || (value >= '1' && value <= '9')) {
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = value;
      setGrid(newGrid);
      setSolved(false);
    }
  }, [grid]);

  // キーボードイベントを処理
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    e.preventDefault();

    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = row > 0 ? row - 1 : 8;
        break;
      case 'ArrowDown':
        newRow = row < 8 ? row + 1 : 0;
        break;
      case 'ArrowLeft':
        newCol = col > 0 ? col - 1 : 8;
        break;
      case 'ArrowRight':
        newCol = col < 8 ? col + 1 : 0;
        break;
      case 'Backspace':
      case 'Delete':
        handleCellChange(row, col, '');
        return;
      default:
        if (e.key >= '1' && e.key <= '9') {
          handleCellChange(row, col, e.key);
          // 数字入力後に右に移動
          newCol = col < 8 ? col + 1 : col;
          if (newCol === col && newRow < 8) newRow++; // 右端なら下に移動
          break;
        } else if (e.key === ' ' || e.key === '0') {
          handleCellChange(row, col, '');
          return;
        } else {
          return;
        }
    }

    setSelectedCell([newRow, newCol]);
  }, [handleCellChange]);

  // セルクリックで選択
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell([row, col]);
  }, []);

  // 数独を解く
  const handleSolve = async () => {
    setSolving(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // UI更新のための遅延

    const gridCopy = grid.map(row => [...row]);
    if (solveSudoku(gridCopy)) {
      setGrid(gridCopy);
      setSolved(true);
      onSolve && onSolve(gridCopy);
    } else {
      alert(t.unsolvable);
      setSolved(false); // 解けない場合はsolved状態をリセット
    }
    setSolving(false);
  };

  // グリッドをクリア
  const handleClear = () => {
    setGrid(createEmptySudokuGrid());
    setSolved(false);
    setSelectedCell([0, 0]);
    onClear && onClear();
  };

  // サンプル問題を設定
  const handleSample = () => {
    setGrid(sampleSudokuGrid);
    setSolved(false);
    onSample && onSample(sampleSudokuGrid);
  };

  return (
    <div>
      <SudokuGrid
        grid={grid}
        onCellChange={handleCellChange}
        selectedCell={selectedCell}
        onCellClick={handleCellClick}
        onKeyDown={handleKeyDown}
        disabled={solving}
      />

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={handleSolve}
          disabled={solving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {solving ? t.solving : t.solve}
        </Button>

        <Button
          onClick={handleClear}
          disabled={solving}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {t.clear}
        </Button>

        <Button
          onClick={handleSample}
          disabled={solving}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {t.sample}
        </Button>
      </div>

      {/* ステータス表示 */}
      {solved && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-lg text-center">
          <p className="text-green-800 font-semibold">{t.solved}</p>
        </div>
      )}
    </div>
  );
};

export default SudokuSolverCore;