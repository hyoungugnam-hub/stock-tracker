"use client";
import { useEffect, useState, useCallback } from "react";
import { stockApi } from "@/lib/api";
import AddStockModal from "@/components/AddStockModal";

interface WatchlistItem {
  id: number;
  ticker: string;
  name: string;
  stop_loss: number | null;
  created_at: string;
}

interface PriceInfo {
  price: number;
  change: number;
  change_pct: number;
  volume: number;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceInfo | "error" | "loading">>({});
  const [loadingList, setLoadingList] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await stockApi.getWatchlist();
      setItems(res.data);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchPrices = useCallback(async (list: WatchlistItem[]) => {
    if (!list.length) return;

    // 로딩 상태로 초기화
    setPrices(Object.fromEntries(list.map((i) => [i.ticker, "loading"])));

    const results = await Promise.allSettled(
      list.map((item) => stockApi.getPrice(item.ticker))
    );

    setPrices(
      Object.fromEntries(
        results.map((result, idx) => [
          list[idx].ticker,
          result.status === "fulfilled" ? result.value.data : "error",
        ])
      )
    );
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    if (items.length > 0) fetchPrices(items);
  }, [items, fetchPrices]);

  const handleDelete = async (id: number) => {
    if (!confirm("관심종목에서 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await stockApi.deleteStock(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const priceCell = (ticker: string) => {
    const p = prices[ticker];
    if (!p || p === "loading")
      return <span className="text-gray-300 animate-pulse">조회 중…</span>;
    if (p === "error")
      return <span className="text-gray-300">조회 실패</span>;
    return <span className="font-medium">{p.price.toLocaleString()}</span>;
  };

  const changeCell = (ticker: string) => {
    const p = prices[ticker];
    if (!p || p === "loading" || p === "error") return null;
    const up = p.change_pct >= 0;
    return (
      <span className={up ? "text-red-500" : "text-blue-500"}>
        {up ? "▲" : "▼"} {Math.abs(p.change_pct).toFixed(2)}%
      </span>
    );
  };

  const stopLossStatus = (item: WatchlistItem) => {
    const p = prices[item.ticker];
    if (!item.stop_loss || !p || p === "loading" || p === "error") return null;
    const breached = p.price <= item.stop_loss;
    return breached ? (
      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
        손절 도달
      </span>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">관심종목</h2>
          <p className="text-sm text-gray-400 mt-0.5">총 {items.length}개 종목</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchPrices(items)}
            disabled={!items.length}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            시세 새로고침
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + 종목 추가
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loadingList ? (
          <div className="text-center text-gray-400 py-16 text-sm">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">관심종목이 없습니다.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              첫 종목 추가하기
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-6 py-3 text-left">종목코드</th>
                <th className="px-6 py-3 text-left">종목명</th>
                <th className="px-6 py-3 text-right">현재가</th>
                <th className="px-6 py-3 text-right">등락률</th>
                <th className="px-6 py-3 text-right">손절가</th>
                <th className="px-6 py-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-blue-600">
                    {item.ticker}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {item.name}
                    {stopLossStatus(item)}
                  </td>
                  <td className="px-6 py-4 text-right">{priceCell(item.ticker)}</td>
                  <td className="px-6 py-4 text-right">{changeCell(item.ticker)}</td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {item.stop_loss ? item.stop_loss.toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {deletingId === item.id ? "삭제 중" : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddStockModal
          onClose={() => setShowModal(false)}
          onAdded={fetchWatchlist}
        />
      )}
    </div>
  );
}
