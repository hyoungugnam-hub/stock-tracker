"use client";
import { useState } from "react";
import { journalApi } from "@/lib/api";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddJournalModal({ onClose, onAdded }: Props) {
  const [ticker, setTicker] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total =
    price && quantity ? parseFloat(price) * parseInt(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await journalApi.addEntry({
        ticker: ticker.trim().toUpperCase(),
        trade_type: tradeType,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        note: note.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "등록 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isBuy = tradeType === "buy";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-5">매매 기록 추가</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 매매 구분 토글 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              매매 구분
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-medium">
              <button
                type="button"
                onClick={() => setTradeType("buy")}
                className={`flex-1 py-2.5 transition-colors ${
                  isBuy
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                매수
              </button>
              <button
                type="button"
                onClick={() => setTradeType("sell")}
                className={`flex-1 py-2.5 border-l border-gray-300 transition-colors ${
                  !isBuy
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                매도
              </button>
            </div>
          </div>

          {/* 종목코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종목코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="예: AAPL, 005930.KS"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>

          {/* 단가 · 수량 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단가 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 총금액 미리보기 */}
          {total > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">총 거래금액</span>
              <span className="font-semibold text-gray-800">
                {total.toLocaleString()}원
              </span>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모{" "}
              <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="매매 이유, 전략, 시장 상황 등을 기록하세요."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 transition-colors ${
                isBuy
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "등록 중..." : isBuy ? "매수 등록" : "매도 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
