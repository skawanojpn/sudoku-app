// src/app/page.tsx
'use client'; // クライアントコンポーネントとしてマークする

import React, { useState } from 'react';
import SudokuScanner from '@/components/SudokuScanner';
import SudokuSolver from '@/components/SudokuSolver'; // SudokuSolverをインポート
import { SudokuGrid as GridType, createEmptySudokuGrid } from '@/lib/sudokuUtils';

export default function Home() {
  const [scannedGrid, setScannedGrid] = useState<GridType>(createEmptySudokuGrid());
  const [activeTab, setActiveTab] = useState<'scanner' | 'solver'>('scanner'); // タブの状態を管理

  const handleSudokuDetected = (grid: GridType) => {
    setScannedGrid(grid);
    setActiveTab('solver'); // OCR検出後、自動的にソルバータブに切り替える
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-4xl font-extrabold text-center text-indigo-800 mb-8">
          数独スキャナー & ソルバー
        </h1>

        {/* タブナビゲーション */}
        <div className="flex justify-center mb-6 border-b border-gray-200">
          <button
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-300 
              ${activeTab === 'scanner' ? 'text-indigo-700 border-b-4 border-indigo-700' : 'text-gray-500 hover:text-indigo-700'}`}
            onClick={() => setActiveTab('scanner')}
          >
            スキャナー
          </button>
          <button
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-300 
              ${activeTab === 'solver' ? 'text-indigo-700 border-b-4 border-indigo-700' : 'text-gray-500 hover:text-indigo-700'}`}
            onClick={() => setActiveTab('solver')}
          >
            ソルバー
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="tab-content">
          {activeTab === 'scanner' && (
            <SudokuScanner onSudokuDetected={handleSudokuDetected} language="ja" />
          )}
          {activeTab === 'solver' && (
            <SudokuSolver initialGrid={scannedGrid} /> {/* スキャンされたグリッドをソルバーに渡す */}
          )}
        </div>
      </div>
    </div>
  );
}
