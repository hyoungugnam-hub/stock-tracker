"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { alertApi } from "@/lib/api";

interface Alert {
  id: number;
  ticker: string;
  name: string;
  stop_loss: number;
  triggered_price: number;
  is_read: boolean;
  created_at: string;
}

interface Toast {
  id: number;
  ticker: string;
  name: string;
  triggered_price: number;
  stop_loss: number;
}

export default function AlertBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevIdsRef = useRef<Set<number> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const removeToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await alertApi.getAlerts();
      const data: Alert[] = res.data;

      // 초기 로드 이후 새 미읽음 알림만 토스트 표시
      if (prevIdsRef.current !== null) {
        const newOnes = data.filter(
          (a) => !a.is_read && !prevIdsRef.current!.has(a.id)
        );
        if (newOnes.length > 0) {
          setToasts((prev) => [
            ...prev,
            ...newOnes.map((a) => ({
              id: a.id,
              ticker: a.ticker,
              name: a.name,
              triggered_price: a.triggered_price,
              stop_loss: a.stop_loss,
            })),
          ]);
          newOnes.forEach((a) =>
            setTimeout(() => removeToast(a.id), 6000)
          );
        }
      }

      prevIdsRef.current = new Set(data.map((a) => a.id));
      setAlerts(data);
    } catch {
      // 네트워크 오류 무시
    }
  }, []);

  // 초기 로드 + 30초 폴링
  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = alerts.filter((a) => !a.is_read).length;

  const handleMarkRead = async (id: number) => {
    await alertApi.markRead(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
  };

  const handleMarkAllRead = async () => {
    await alertApi.markAllRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const handleDelete = async (id: number) => {
    await alertApi.deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      {/* 벨 아이콘 */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="손절 알림"
          className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center font-bold leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* 드롭다운 */}
        {open && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">
                손절 알림
                {unread > 0 && (
                  <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </span>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* 목록 */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {alerts.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">
                  알림이 없습니다.
                </p>
              ) : (
                alerts.slice(0, 20).map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-4 py-3 flex items-start gap-3 ${
                      !alert.is_read ? "bg-red-50" : "bg-white"
                    }`}
                  >
                    {/* 점 표시 */}
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !alert.is_read ? "bg-red-500" : "bg-gray-200"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        <span className="font-mono text-blue-600">
                          {alert.ticker}
                        </span>{" "}
                        손절가 도달
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        현재가{" "}
                        <span className="text-red-500 font-semibold">
                          {alert.triggered_price.toLocaleString()}
                        </span>{" "}
                        ≤ 손절가 {alert.stop_loss.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(alert.created_at), "MM/dd HH:mm", {
                          locale: ko,
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          읽음
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 토스트 알림 */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[100]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border-l-4 border-red-500 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 w-72"
          >
            <span className="text-red-500 text-base mt-0.5">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                손절가 도달: {toast.ticker}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {toast.name} 현재가{" "}
                <span className="text-red-500 font-medium">
                  {toast.triggered_price.toLocaleString()}
                </span>
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-300 hover:text-gray-500 text-sm shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
