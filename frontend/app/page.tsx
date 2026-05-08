"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { stockApi, journalApi } from "@/lib/api";

interface WatchlistItem {
  id: number;
  ticker: string;
  name: string;
  stop_loss: number | null;
}

export default function Home() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [tradeCount, setTradeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      stockApi.getWatchlist(),
      journalApi.getEntries(),
    ]).then(([watchRes, journalRes]) => {
      setItems(watchRes.data);
      setTradeCount(journalRes.data.length);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">대시보드</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">관심 종목 수</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? "—" : items.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">손절가 설정 종목</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {loading ? "—" : items.filter((i) => i.stop_loss).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">총 매매 건수</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading || tradeCount === null ? "—" : `${tradeCount}건`}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">관심종목 현황</h2>
          <Link
            href="/watchlist"
            className="text-sm text-blue-600 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-3">종목이 없습니다.</p>
              <Link
                href="/watchlist"
                className="text-sm text-blue-600 hover:underline"
              >
                관심종목 추가하러 가기
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">종목코드</th>
                  <th className="px-6 py-3 text-left">종목명</th>
                  <th className="px-6 py-3 text-right">손절가</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono font-semibold text-blue-600">
                      {item.ticker}
                    </td>
                    <td className="px-6 py-3 text-gray-800">{item.name}</td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {item.stop_loss ? item.stop_loss.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
