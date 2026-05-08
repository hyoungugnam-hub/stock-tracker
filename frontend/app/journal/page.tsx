"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { journalApi } from "@/lib/api";
import AddJournalModal from "@/components/AddJournalModal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface JournalEntry {
  id: number;
  ticker: string;
  trade_type: "buy" | "sell";
  price: number;
  quantity: number;
  note: string | null;
  traded_at: string;
}

type Filter = "all" | "buy" | "sell";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await journalApi.getEntries();
      setEntries(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = useMemo(() => {
    const buys = entries.filter((e) => e.trade_type === "buy");
    const sells = entries.filter((e) => e.trade_type === "sell");
    return {
      count: entries.length,
      buyCount: buys.length,
      sellCount: sells.length,
      buyTotal: buys.reduce((s, e) => s + e.price * e.quantity, 0),
      sellTotal: sells.reduce((s, e) => s + e.price * e.quantity, 0),
    };
  }, [entries]);

  const filtered = useMemo(
    () =>
      filter === "all" ? entries : entries.filter((e) => e.trade_type === filter),
    [entries, filter]
  );

  const handleDelete = async (id: number) => {
    if (!confirm("이 매매 기록을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await journalApi.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">매매일지</h2>
          <p className="text-sm text-gray-400 mt-0.5">총 {stats.count}건</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + 매매 기록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs text-gray-500 mb-1">총 거래 건수</p>
          <p className="text-2xl font-bold text-gray-900">{stats.count}건</p>
          <p className="text-xs text-gray-400 mt-1">
            매수 {stats.buyCount} · 매도 {stats.sellCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs text-gray-500 mb-1">총 매수 금액</p>
          <p className="text-2xl font-bold text-red-500">
            {stats.buyTotal.toLocaleString()}
            <span className="text-base font-normal ml-1">원</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs text-gray-500 mb-1">총 매도 금액</p>
          <p className="text-2xl font-bold text-blue-500">
            {stats.sellTotal.toLocaleString()}
            <span className="text-base font-normal ml-1">원</span>
          </p>
        </div>
      </div>

      {/* 필터 탭 + 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* 탭 */}
        <div className="flex border-b border-gray-100 px-4">
          {(["all", "buy", "sell"] as const).map((f) => {
            const label = f === "all" ? "전체" : f === "buy" ? "매수" : "매도";
            const count =
              f === "all" ? stats.count : f === "buy" ? stats.buyCount : stats.sellCount;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  filter === f
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>

        {/* 내용 */}
        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">매매 기록이 없습니다.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              첫 기록 추가하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs whitespace-nowrap">
                <tr>
                  <th className="px-6 py-3 text-left">날짜</th>
                  <th className="px-6 py-3 text-left">종목코드</th>
                  <th className="px-6 py-3 text-center">구분</th>
                  <th className="px-6 py-3 text-right">단가</th>
                  <th className="px-6 py-3 text-right">수량</th>
                  <th className="px-6 py-3 text-right">총금액</th>
                  <th className="px-6 py-3 text-left">메모</th>
                  <th className="px-6 py-3 text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap text-xs">
                      {format(new Date(entry.traded_at), "yy.MM.dd HH:mm", {
                        locale: ko,
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {entry.ticker}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          entry.trade_type === "buy"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {entry.trade_type === "buy" ? "매수" : "매도"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums">
                      {entry.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {entry.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums">
                      {(entry.price * entry.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                      {entry.note ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {deletingId === entry.id ? "삭제 중" : "삭제"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddJournalModal
          onClose={() => setShowModal(false)}
          onAdded={fetchEntries}
        />
      )}
    </div>
  );
}
