import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const stockApi = {
  getWatchlist: () => api.get("/stocks/watchlist"),
  addStock: (data: { ticker: string; name: string; stop_loss?: number }) =>
    api.post("/stocks/watchlist", data),
  deleteStock: (id: number) => api.delete(`/stocks/watchlist/${id}`),
  getPrice: (ticker: string) => api.get(`/stocks/price/${ticker}`),
};

export const journalApi = {
  getEntries: () => api.get("/journal"),
  addEntry: (data: {
    ticker: string;
    trade_type: "buy" | "sell";
    price: number;
    quantity: number;
    note?: string;
  }) => api.post("/journal", data),
  deleteEntry: (id: number) => api.delete(`/journal/${id}`),
};

export const alertApi = {
  getAlerts: (unreadOnly = false) =>
    api.get(`/alerts${unreadOnly ? "?unread_only=true" : ""}`),
  markRead: (id: number) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.post("/alerts/read-all"),
  deleteAlert: (id: number) => api.delete(`/alerts/${id}`),
  triggerCheck: () => api.post("/alerts/check-now"),
};
