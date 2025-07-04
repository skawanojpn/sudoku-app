// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css'; // グローバルCSSをインポート

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '数独スキャナー & ソルバー',
  description: 'カメラで数独をスキャンし、自動で問題を解くWebアプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}