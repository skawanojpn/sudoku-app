// src/components/SudokuScanner.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SudokuGrid as GridType, sampleSudokuGrid } from '@/lib/sudokuUtils'; // sampleSudokuGridをインポート

interface SudokuScannerProps {
  onSudokuDetected: (grid: GridType) => void;
  language: 'ja' | 'en';
}

type StatusType = 'processing' | 'success' | 'error' | null;

const SudokuScanner: React.FC<SudokuScannerProps> = ({ onSudokuDetected, language }) => {
  const [status, setStatus] = useState<StatusType>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [analysisInfo, setAnalysisInfo] = useState<string | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const texts = {
    ja: {
      instructionsTitle: '📋 使い方',
      instruction1: '• 「画像ファイルを選択 / 写真を撮る」ボタンをクリック',
      instruction2: '• 画像ファイルを下の点線エリアにドラッグ',
      instruction3: '• 数独の問題がはっきりと見えるように撮影・保存された画像を選択してください',
      instruction4: '• 画像解析により数字を自動認識し、手動で調整も可能です',
      shootingTipsTitle: '📸 撮影のコツ：',
      tip1: '数独の問題全体がはっきりと見えるように撮影',
      tip2: '影がかからないよう十分な明るさで撮影',
      tip3: '真上から撮影し、歪みを最小限に',
      tip4: '数字が鮮明に読める解像度で撮影',
      selectFileButton: '📁 画像ファイルを選択 / 📷 写真を撮る',
      dropZoneText: '📎 ここに画像ファイルをドラッグ＆ドロップ',
      dropZoneSubText: 'または上のボタンをクリック',
      processingImage: '画像を読み込み中...',
      analyzingImage: '画像を解析中...',
      analysisComplete: '画像解析が完了しました。必要に応じて数字を手動で調整してください。',
      imageProcessingFailed: '画像の処理に失敗しました。',
      imageLoadingFailed: '画像の読み込みに失敗しました。',
      selectImageFile: '画像ファイルを選択してください。',
      analysisResult: '🔍 画像解析結果：',
      reAnalyze: '🔍 再解析',
      clearGrid: '🗑️ クリア',
      sample: '📋 サンプル',
    },
    en: {
      instructionsTitle: '📋 How to Use',
      instruction1: '• Click the "Select Image / Take Photo" button',
      instruction2: '• Drag and drop image files into the dotted area below',
      instruction3: '• Select a clearly photographed and saved Sudoku puzzle image',
      instruction4: '• Numbers will be automatically recognized via image analysis, and can be adjusted manually',
      shootingTipsTitle: '📸 Shooting Tips:',
      tip1: 'Capture the entire Sudoku puzzle clearly',
      tip2: 'Ensure sufficient lighting to avoid shadows',
      tip3: 'Shoot directly from above to minimize distortion',
      tip4: 'Capture at a resolution where numbers are clearly readable',
      selectFileButton: '📁 Select Image File / 📷 Take Photo',
      dropZoneText: '📎 Drag & Drop Image Here',
      dropZoneSubText: 'Or click the button above',
      processingImage: 'Loading image...',
      analyzingImage: 'Analyzing image...',
      analysisComplete: 'Image analysis complete. Adjust numbers manually if needed.',
      imageProcessingFailed: 'Failed to process image.',
      imageLoadingFailed: 'Failed to load image.',
      selectImageFile: 'Please select an image file.',
      analysisResult: '🔍 Image Analysis Result:',
      reAnalyze: '🔍 Re-analyze',
      clearGrid: '🗑️ Clear',
      sample: '📋 Sample',
    }
  };
  const t = texts[language];

  const showStatus = useCallback((message: string, type: StatusType = 'processing') => {
    setStatusMessage(message);
    setStatus(type);
  }, []);

  const hideStatus = useCallback(() => {
    setStatus(null);
    setStatusMessage('');
  }, []);

  // 画像内容を解析（簡易版 - OCRプレースホルダー）
  const analyzeImageContent = useCallback(async (imageBlob: Blob) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = function() {
        showStatus(t.analyzingImage, 'processing');

        const canvas = analysisCanvasRef.current;
        if (!canvas) {
          showStatus(t.imageProcessingFailed, 'error');
          return resolve();
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          showStatus(t.imageProcessingFailed, 'error');
          return resolve();
        }

        const maxSize = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 簡易的な画像解析（OCRの代わりとして、ランダムな数独を生成）
        // *** ここに実際のOCRロジックを統合します ***
        const simulatedDetectedNumbers = generateSimulatedSudoku(); // 仮の関数
        onSudokuDetected(simulatedDetectedNumbers);

        setAnalysisInfo(`${t.analysisResult} 画像サイズ: ${Math.round(width)}×${Math.round(height)}`);
        showStatus(t.analysisComplete, 'success');
        resolve();
      };

      img.onerror = function() {
        showStatus(t.imageLoadingFailed, 'error');
        resolve();
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }, [onSudokuDetected, showStatus, t]);

  // 仮の数独生成関数（OCR実装までの一時的なもの）
  const generateSimulatedSudoku = (): GridType => {
    const patterns = [
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
    // ランダムなサンプルを返すようにしても良い
    return patterns;
  };

  const processImage = useCallback(async (imageBlob: Blob) => {
    try {
      showStatus(t.processingImage, 'processing');
      setPreviewImageUrl(URL.createObjectURL(imageBlob));
      await analyzeImageContent(imageBlob);
    } catch (error) {
      console.error('画像処理エラー:', error);
      showStatus(t.imageProcessingFailed, 'error');
    }
  }, [analyzeImageContent, showStatus, t]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        showStatus(t.selectImageFile, 'error');
      }
    }
  }, [processImage, showStatus, t]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragover');
  }, []);

  const handleReanalyze = () => {
    if (previewImageUrl) {
      // FileReaderを使ってBlobを再生成するか、元のBlobをstateに保持するか
      // ここでは簡易的にサンプル数独を再検出する
      onSudokuDetected(generateSimulatedSudoku());
      showStatus(t.analysisComplete, 'success');
    }
  };

  const handleClearScanner = () => {
    setPreviewImageUrl(null);
    setAnalysisInfo(null);
    hideStatus();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container p-8 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {language === 'ja' ? '📱 数独カメラスキャナー' : '📱 Sudoku Camera Scanner'}
      </h2>

      <div className="instructions bg-gray-50 p-5 rounded-xl mb-6 border-l-4 border-indigo-500">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.instructionsTitle}</h3>
        <ul className="text-gray-600 list-disc list-inside space-y-1">
          <li>{t.instruction1}</li>
          <li>{t.instruction2}</li>
          <li>{t.instruction3}</li>
          <li>{t.instruction4}</li>
        </ul>
        <div className="bg-blue-50 p-4 rounded-lg mt-3 border-l-4 border-blue-400">
          <strong className="text-blue-700 block mb-2">{t.shootingTipsTitle}</strong>
          <ul className="text-blue-600 list-disc list-inside space-y-1">
            <li>{t.tip1}</li>
            <li>{t.tip2}</li>
            <li>{t.tip3}</li>
            <li>{t.tip4}</li>
          </ul>
        </div>
      </div>

      <div className="upload-section text-center mb-6">
        <div className="file-input mb-5">
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
            ref={fileInputRef}
          />
          <label
            htmlFor="fileInput"
            className="inline-block bg-gradient-to-br from-green-500 to-green-700 text-white px-8 py-4 rounded-full cursor-pointer text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all"
          >
            {t.selectFileButton}
          </label>
        </div>

        <div
          className="drop-zone border-4 border-dashed border-indigo-400 rounded-xl p-10 bg-blue-50 transition-all hover:border-indigo-600 hover:bg-blue-100"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <p className="text-gray-700 text-lg font-medium">{t.dropZoneText}</p>
          <p className="text-gray-500 text-sm mt-2">{t.dropZoneSubText}</p>
        </div>
      </div>

      {status && (
        <div
          className={`status ${status === 'processing' ? 'processing' : status === 'success' ? 'success' : 'error'} p-4 rounded-lg text-center font-semibold mb-4`}
        >
          {status === 'processing' && <span className="loading-spinner mr-2"></span>}
          {statusMessage}
        </div>
      )}

      {previewImageUrl && (
        <img src={previewImageUrl} alt="Preview" className="preview-image max-w-full max-h-[400px] rounded-xl shadow-lg mx-auto my-6" />
      )}

      {previewImageUrl && (
        <div className="canvas-container text-center my-6">
          <canvas ref={analysisCanvasRef} className="border-2 border-gray-200 rounded-lg max-w-full"></canvas>
        </div>
      )}

      {analysisInfo && (
        <div className="image-analysis bg-blue-100 p-4 rounded-lg my-6 border-l-4 border-blue-500">
          <p className="text-blue-800 font-semibold">{analysisInfo}</p>
        </div>
      )}

      {(previewImageUrl || status === 'success') && (
        <div className="controls flex justify-center gap-4 my-6 flex-wrap">
          <Button onClick={handleReanalyze} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            {t.reAnalyze}
          </Button>
          <Button onClick={handleClearScanner} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            {t.clearGrid}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SudokuScanner;