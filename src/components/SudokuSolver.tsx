// src/components/SudokuSolver.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SudokuSolverProps {
  initialGrid?: string[][]; // OCR解析結果のグリッドを受け取るためのプロップ
}

const SudokuSolver: React.FC<SudokuSolverProps> = ({ initialGrid }) => {
  const [grid, setGrid] = useState<string[][]>(() => 
    initialGrid || Array(9).fill().map(() => Array(9).fill(''))
  );
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [language, setLanguage] = useState('ja');
  const cellRefs = useRef(Array(9).fill().map(() => Array(9).fill(null)));

  // initialGridが変更されたときにグリッドを更新
  useEffect(() => {
    if (initialGrid) {
      setGrid(initialGrid);
      setSolved(false); // 新しいグリッドがロードされたら解決済み状態をリセット
    }
  }, [initialGrid]);

  // 言語リソース
  const texts = {
    ja: {
      title: 'SUDOKU Solver',
      subtitle: '数独パズルを入力して自動的に解きます',
      solving: '解いています...',
      solve: '解く',
      clear: 'クリア',
      sample: 'サンプル問題',
      solved: '🎉 数独が解けました！',
      unsolvable: 'この数独は解けません。入力を確認してください。',
      howToUse: '使い方:',
      instruction1: '• 既知の数字を1-9で入力してください',
      instruction2: '• カーソルキー（↑↓←→）でマスを移動できます',
      instruction3: '• 「サンプル問題」ボタンで例題を試すことができます',
      instruction4: '• 「解く」ボタンで自動的に数独を解きます',
      instruction5: '• 「クリア」ボタンで全てのマスをクリアします'
    },
    en: {
      title: 'SUDOKU Solver',
      subtitle: 'Enter your Sudoku puzzle and solve it automatically',
      solving: 'Solving...',
      solve: 'Solve',
      clear: 'Clear',
      sample: 'Sample',
      solved: '🎉 Sudoku solved!',
      unsolvable: 'This Sudoku cannot be solved. Please check your input.',
      howToUse: 'How to use:',
      instruction1: '• Enter known numbers (1-9) in the cells',
      instruction2: '• Use arrow keys (↑↓←→) to move between cells',
      instruction3: '• Use "Sample" button to try an example puzzle',
      instruction4: '• Use "Solve" button to automatically solve the puzzle',
      instruction5: '• Use "Clear" button to reset all cells'
    }
  };

  const t = texts[language];

  // 数独の制約をチェックする関数
  const isValid = (grid: string[][], row: number, col: number, num: string): boolean => {
    // 行をチェック
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // 列をチェック
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // 3x3ボックスをチェック
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  };

  // バックトラッキングアルゴリズムで数独を解く
  const solveSudoku = (currentGrid: string[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentGrid[row][col] === '' || currentGrid[row][col] === '0') {
          for (let num = 1; num <= 9; num++) {
            if (isValid(currentGrid, row, col, num.toString())) {
              currentGrid[row][col] = num.toString();
              
              if (solveSudoku(currentGrid)) {
                return true;
              }
              
              currentGrid[row][col] = ''; // バックトラック
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  // セルの値を変更する
  const handleCellChange = (row: number, col: number, value: string) => {
    if (value === '' || (value >= '1' && value <= '9')) {
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = value;
      setGrid(newGrid);
      setSolved(false);
    }
  };

  // キーボードイベントを処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
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
          return;
        } else if (e.key === ' ' || e.key === '0') {
          handleCellChange(row, col, '');
          return;
        } else {
          return;
        }
    }
    
    setSelectedCell([newRow, newCol]);
    // フォーカスを新しいセルに移動
    if (cellRefs.current[newRow][newCol]) {
      cellRefs.current[newRow][newCol].focus();
    }
  };

  // セルクリックで選択
  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  // 数独を解く
  const handleSolve = async () => {
    setSolving(true);
    
    // UIの更新のために少し待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const gridCopy = grid.map(row => [...row]);
    
    if (solveSudoku(gridCopy)) {
      setGrid(gridCopy);
      setSolved(true);
    } else {
      alert(t.unsolvable);
    }
    
    setSolving(false);
  };

  // グリッドをクリア
  const handleClear = () => {
    setGrid(Array(9).fill().map(() => Array(9).fill('')));
    setSolved(false);
    setSelectedCell([0, 0]);
    if (cellRefs.current[0][0]) {
      cellRefs.current[0][0].focus();
    }
  };

  // サンプル問題を設定
  const handleSample = () => {
    const sampleGrid = [
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
    setGrid(sampleGrid);
    setSolved(false);
  };

  // 言語切替
  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  // 初期フォーカス設定
  useEffect(() => {
    if (cellRefs.current[0][0]) {
      cellRefs.current[0][0].focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-800">{t.title}</h1>
            <Button
              onClick={toggleLanguage}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {language === 'ja' ? 'EN' : 'JA'}
            </Button>
          </div>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 数独グリッド */}
          <div className="grid grid-cols-9 gap-1 mb-8 bg-gray-800 p-4 rounded-lg mx-auto w-fit">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  ref={el => cellRefs.current[rowIndex][colIndex] = el}
                  type="text"
                  maxLength="1"
                  value={cell}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-12 h-12 text-center text-xl font-bold border-2 
                    ${solved ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}
                    ${selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-4 border-b-gray-800' : ''}
                    ${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-4 border-r-gray-800' : ''}
                  `}
                  disabled={solving}
                />
              ))
            )}
          </div>

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

          {/* 使い方 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{t.howToUse}</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>{t.instruction1}</li>
              <li>{t.instruction2}</li>
              <li>{t.instruction3}</li>
              <li>{t.instruction4}</li>
              <li>{t.instruction5}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SudokuSolver;
