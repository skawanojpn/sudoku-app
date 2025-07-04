// src/components/SudokuGrid.tsx
import React, { useRef, useEffect } from 'react';
import { SudokuGrid as GridType } from '@/lib/sudokuUtils';

interface SudokuGridProps {
  grid: GridType;
  onCellChange: (row: number, col: number, value: string) => void;
  selectedCell: [number, number];
  onCellClick: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => void;
  disabled?: boolean;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({
  grid,
  onCellChange,
  selectedCell,
  onCellClick,
  onKeyDown,
  disabled = false,
}) => {
  const cellRefs = useRef<HTMLInputElement[][]>(Array(9).fill(null).map(() => Array(9).fill(null)));

  useEffect(() => {
    // 選択されたセルにフォーカスを設定
    const [row, col] = selectedCell;
    if (cellRefs.current[row] && cellRefs.current[row][col]) {
      cellRefs.current[row][col].focus();
    }
  }, [selectedCell]);

  return (
    <div className="grid grid-cols-9 gap-1 mb-8 bg-gray-800 p-4 rounded-lg mx-auto w-fit">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <input
            key={`${rowIndex}-${colIndex}`}
            ref={el => {
              if (el) { // refがnullでないことを確認
                if (!cellRefs.current[rowIndex]) {
                    cellRefs.current[rowIndex] = [];
                }
                cellRefs.current[rowIndex][colIndex] = el;
              }
            }}
            type="text"
            maxLength={1}
            value={cell === 0 ? '' : cell} // 0を空文字として表示
            onChange={(e) => {
              const value = e.target.value.replace(/[^1-9]/g, ''); // 1-9以外の入力を除去
              onCellChange(rowIndex, colIndex, value);
            }}
            onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
            onClick={() => onCellClick(rowIndex, colIndex)}
            className={`
              w-12 h-12 text-center text-xl font-bold border-2
              ${grid[rowIndex][colIndex] !== '' && grid[rowIndex][colIndex] !== 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}
              ${selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-4 border-b-gray-800' : ''}
              ${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-4 border-r-gray-800' : ''}
            `}
            disabled={disabled}
          />
        ))
      )}
    </div>
  );
};

export default SudokuGrid;