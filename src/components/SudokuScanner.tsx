// src/components/SudokuScanner.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SudokuGrid as GridType, createEmptySudokuGrid } from '@/lib/sudokuUtils';
import { createWorker, PSM } from 'tesseract.js'; // Tesseract.jsをインポート

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

  // Tesseract.js Workerの状態管理
  const [tesseractWorker, setTesseractWorker] = useState<Tesseract.Worker | null>(null);
  const [workerReady, setWorkerReady] = useState(false);

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
      clearScanner: '🗑️ スキャナーをクリア',
      loadingOCR: 'OCRエンジンを準備中...',
      ocrReady: 'OCRエンジン準備完了',
      ocrFailed: 'OCRエンジンの準備に失敗しました。',
      noDigitsFound: '画像から数字を検出できませんでした。',
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
      clearScanner: '🗑️ Clear Scanner',
      loadingOCR: 'Preparing OCR engine...',
      ocrReady: 'OCR engine ready.',
      ocrFailed: 'Failed to prepare OCR engine.',
      noDigitsFound: 'No digits found in the image.',
    }
  };
  const t = texts[language];

  // Tesseract.js Workerの初期化
  useEffect(() => {
    const initializeWorker = async () => {
      showStatus(t.loadingOCR, 'processing');
      try {
        const worker = await createWorker('eng', 1, {
            // Tesseract.jsのログを開発コンソールに表示
            logger: (m) => console.log(m),
        });
        // PSM.SINGLE_CHAR を使うと個々の文字認識に特化できるが、
        // Sudokuの場合はグリッド全体を認識し、その中の数字を解析する方が良い場合が多い。
        // ここではデフォルトのPSM (Page Segmentation Mode) を使用。
        // PSM.SINGLE_BLOCK (3) や PSM.SINGLE_LINE (7) なども試す価値あり。
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
            // 数字のみに絞り込む (ただし、非数字も検出される可能性あり)
            tessedit_char_whitelist: '0123456789',
            // ページセグメンテーションモードを調整
            // PSM.SPARSE_TEXT_OSD (11) は、自由に配置されたテキストに対応。
            // PSM.SINGLE_BLOCK (3) は、単一のテキストブロックとして扱う。
            // Sudokuグリッドの場合は、グリッド全体が認識できるようなモードが良い。
            // ここではPSM.SINGLE_BLOCK (3) を試す。
            // もし認識精度が低い場合、PSM.SINGLE_CHAR (10) を使って個々の文字を認識し、
            // 位置情報でマッピングする方が良い場合もある。
            // Tesseract.jsの公式ドキュメントでPSMモードを確認してください。
            // https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html#page-segmentation-modes
            // 以下のPSMは例です。
            // 'tessedit_pageseg_mode': PSM.SINGLE_BLOCK, // PSM.SINGLE_BLOCK = 3
        });
        setTesseractWorker(worker);
        setWorkerReady(true);
        showStatus(t.ocrReady, 'success');
      } catch (error) {
        console.error('OCR worker initialization failed:', error);
        showStatus(t.ocrFailed, 'error');
      }
    };

    if (!tesseractWorker) {
      initializeWorker();
    }

    return () => {
      // コンポーネントのアンマウント時にワーカーを終了
      if (tesseractWorker) {
        tesseractWorker.terminate();
        setTesseractWorker(null);
        setWorkerReady(false);
      }
    };
  }, [tesseractWorker, t.loadingOCR, t.ocrReady, t.ocrFailed, showStatus]);

  const showStatus = useCallback((message: string, type: StatusType = 'processing') => {
    setStatusMessage(message);
    setStatus(type);
  }, []);

  const hideStatus = useCallback(() => {
    setStatus(null);
    setStatusMessage('');
  }, []);

  // 画像内容を解析 (OCR機能を含む)
  const analyzeImageContent = useCallback(async (imageBlob: Blob) => {
    if (!workerReady || !tesseractWorker) {
      showStatus(t.loadingOCR, 'processing');
      return;
    }

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = async function() { // async functionに変更
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

        const maxSize = 800; // キャンバスの最大サイズを調整 (OCR処理のため大きめに)
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

        // OCRを実行
        try {
          // キャンバス要素を直接Tesseract.jsに渡す
          const { data: { text, words } } = await tesseractWorker.recognize(canvas);

          console.log('OCR Raw Text:', text);
          console.log('OCR Words:', words);

          const detectedGrid: GridType = createEmptySudokuGrid();
          const cellWidth = canvas.width / 9;
          const cellHeight = canvas.height / 9;
          let digitsFound = 0;

          // 認識された各単語（数字）を数独グリッドにマッピング
          words.forEach(word => {
            const digit = word.text.trim();
            // 1桁の数字（1-9）のみを対象とする
            if (digit.length === 1 && digit >= '1' && digit <= '9') {
              // 単語の中心座標から対応するセルを特定
              const centerX = (word.bbox.x0 + word.bbox.x1) / 2;
              const centerY = (word.bbox.y0 + word.bbox.y1) / 2;

              const col = Math.floor(centerX / cellWidth);
              const row = Math.floor(centerY / cellHeight);

              // グリッド範囲内か確認
              if (row >= 0 && row < 9 && col >= 0 && col < 9) {
                // 既にそのセルに数字がある場合は、より中央に近いものを採用するなどのロジックを追加可能
                // 今回はシンプルに、最初に検出された数字を採用
                if (detectedGrid[row][col] === '') {
                  detectedGrid[row][col] = digit;
                  digitsFound++;
                }
              }
            }
          });

          if (digitsFound > 0) {
            onSudokuDetected(detectedGrid);
            setAnalysisInfo(`${t.analysisResult} 画像サイズ: ${Math.round(width)}×${Math.round(height)}。認識された数字の数: ${digitsFound}`);
            showStatus(t.analysisComplete, 'success');
          } else {
            onSudokuDetected(createEmptySudokuGrid()); // 数字が見つからない場合は空のグリッドを渡す
            setAnalysisInfo(`${t.analysisResult} 画像サイズ: ${Math.round(width)}×${Math.round(height)}。`);
            showStatus(t.noDigitsFound, 'error'); // 数字が見つからなかった場合
          }


        } catch (ocrError) {
          console.error('OCR recognition failed:', ocrError);
          showStatus(t.imageProcessingFailed, 'error');
        } finally {
          resolve();
        }
      };

      img.onerror = function() {
        showStatus(t.imageLoadingFailed, 'error');
        resolve();
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }, [onSudokuDetected, showStatus, workerReady, tesseractWorker, t]); // 依存関係にtesseractWorkerとworkerReadyを追加

  const processImage = useCallback(async (imageBlob: Blob) => {
    if (!workerReady) {
      showStatus(t.loadingOCR, 'processing');
      // OCRワーカーが準備できていない場合は処理を中断し、準備完了後に再試行を促す
      return;
    }
    try {
      showStatus(t.processingImage, 'processing');
      setPreviewImageUrl(URL.createObjectURL(imageBlob));
      await analyzeImageContent(imageBlob);
    } catch (error) {
      console.error('画像処理エラー:', error);
      showStatus(t.imageProcessingFailed, 'error');
    }
  }, [analyzeImageContent, showStatus, workerReady, t]);

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

  const handleReanalyze = useCallback(() => {
    // 現在のプレビュー画像URLがあれば、それを再利用してOCRを再実行
    if (previewImageUrl) {
      // URLからBlobを再取得する簡単な方法がないため、
      // 実際には元のBlobをstateに保存しておくか、
      // ユーザーに再選択を促す方が良いかもしれません。
      // ここでは、一旦、OCRを再実行するシミュレーションとして、
      // 最初の画像を読み込んだ時と同じロジックを呼び出すようにします。
      // ただし、この実装では元のBlobを失っているため、
      // 正確な再解析には不向きです。
      // 実際の運用では、画像をstateに保持することを推奨します。
      showStatus(t.analyzingImage, 'processing');
      // この関数が呼ばれた時点で `previewImageUrl` は存在するため、
      // `img.src` を使って画像を再読み込みし、`analyzeImageContent` を再実行します。
      // ただし、これは新しいBlobを生成しないため、厳密な再解析ではないですが、
      // Tesseract.jsのパラメータ変更などを試す際には有効です。
      const img = new Image();
      img.onload = () => {
          const canvas = analysisCanvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア
              // 元の画像をキャンバスに描画し直す
              const maxSize = 800;
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

              // 再解析を実行
              // ここでは `tesseractWorker.recognize(canvas)` を直接呼び出す
              if (tesseractWorker) {
                tesseractWorker.recognize(canvas).then(({ data: { words } }) => {
                    const detectedGrid: GridType = createEmptySudokuGrid();
                    const cellWidth = canvas.width / 9;
                    const cellHeight = canvas.height / 9;
                    let digitsFound = 0;

                    words.forEach(word => {
                        const digit = word.text.trim();
                        if (digit.length === 1 && digit >= '1' && digit <= '9') {
                            const centerX = (word.bbox.x0 + word.bbox.x1) / 2;
                            const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
                            const col = Math.floor(centerX / cellWidth);
                            const row = Math.floor(centerY / cellHeight);
                            if (row >= 0 && row < 9 && col >= 0 && col < 9 && detectedGrid[row][col] === '') {
                                detectedGrid[row][col] = digit;
                                digitsFound++;
                            }
                        }
                    });
                    if (digitsFound > 0) {
                      onSudokuDetected(detectedGrid);
                      setAnalysisInfo(`${t.analysisResult} 画像サイズ: ${Math.round(width)}×${Math.round(height)}。認識された数字の数: ${digitsFound}`);
                      showStatus(t.analysisComplete, 'success');
                    } else {
                      onSudokuDetected(createEmptySudokuGrid());
                      setAnalysisInfo(`${t.analysisResult} 画像サイズ: ${Math.round(width)}×${Math.round(height)}。`);
                      showStatus(t.noDigitsFound, 'error');
                    }
                }).catch(ocrError => {
                    console.error('OCR recognition failed during reanalyze:', ocrError);
                    showStatus(t.imageProcessingFailed, 'error');
                });
              }
          }
      };
      img.onerror = () => showStatus(t.imageLoadingFailed, 'error');
      img.src = previewImageUrl;
    } else {
      showStatus(t.selectImageFile, 'error');
    }
  }, [previewImageUrl, onSudokuDetected, showStatus, tesseractWorker, t]);


  const handleClearScanner = () => {
    setPreviewImageUrl(null);
    setAnalysisInfo(null);
    hideStatus();
    onSudokuDetected(createEmptySudokuGrid()); // グリッドをクリアする
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container p-8 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {language === 'ja' ? '📱 数独カメラスキャナー (OCR機能付き)' : '📱 Sudoku Camera Scanner (with OCR)'}
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
            capture="environment" // スマートフォンでカメラを直接起動
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

      {(previewImageUrl || status === 'success' || status === 'error') && (
        <div className="controls flex justify-center gap-4 my-6 flex-wrap">
          <Button
            onClick={handleReanalyze}
            disabled={!workerReady || !previewImageUrl} // ワーカー準備完了かつ画像がある場合のみ有効
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {t.reAnalyze}
          </Button>
          <Button
            onClick={handleClearScanner}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {t.clearScanner}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SudokuScanner;