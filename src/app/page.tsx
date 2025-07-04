// src/app/page.tsx
'use client'; // クライアントコンポーネントとしてマーク

import React, { useState } from 'react';
import SudokuScanner from '@/components/SudokuScanner';
import SudokuSolverCore from '@/components/SudokuSolverCore';
import { createEmptySudokuGrid, SudokuGrid as GridType } from '@/lib/sudokuUtils';
import { Button } from '@/components/ui/button'; // shadcn/uiのButtonをインポート

const HomePage: React.FC = () => {
  const [sudokuGrid, setSudokuGrid] = useState<GridType>(createEmptySudokuGrid());
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');

  const handleSudokuDetected = (detectedGrid: GridType) => {
    setSudokuGrid(detectedGrid);
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'ja' ? 'en' : 'ja'));
  };

  const texts = {
    ja: {
      title: '数独スキャナー & ソルバー',
      languageSwitch: 'EN',
      solverSectionTitle: '🧩 数独ソルバー'
    },
    en: {
      title: 'Sudoku Scanner & Solver',
      languageSwitch: 'JA',
      solverSectionTitle: '🧩 Sudoku Solver'
    }
  };
  const t = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div> {/* Placeholder for alignment */}
            <h1 className="text-4xl font-bold text-gray-800">{t.title}</h1>
            <Button
              onClick={toggleLanguage}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {t.languageSwitch}
            </Button>
          </div>
        </div>

        {/* 数独スキャナーセクション */}
        <div className="mb-12">
          <SudokuScanner onSudokuDetected={handleSudokuDetected} language={language} />
        </div>

        {/* 数独ソルバーセクション */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {t.solverSectionTitle}
          </h2>
          <SudokuSolverCore initialGrid={sudokuGrid} language={language} />
        </div>

        {/* 使い方セクションはSudokuSolverCore内に統合されているため不要 */}
      </div>
    </div>
  );
};

export default HomePage;