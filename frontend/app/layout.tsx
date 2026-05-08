import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AlertBell from "@/components/AlertBell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "주식 시세 추적 & 매매일지",
  description: "실시간 주식 시세 추적 및 매매일지 관리 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">📈 주식 트래커</h1>
          <div className="flex items-center gap-6 text-sm">
            <a href="/" className="hover:text-blue-400 transition-colors">대시보드</a>
            <a href="/watchlist" className="hover:text-blue-400 transition-colors">관심종목</a>
            <a href="/journal" className="hover:text-blue-400 transition-colors">매매일지</a>
            <AlertBell />
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
