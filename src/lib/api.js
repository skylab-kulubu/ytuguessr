import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  withCredentials: true,
});

export const startGame = (body) => api.post("/game/start", body).then(r => r.data);
export const makeGuess = (lat, lng) => api.post("/game/guess", { latitude: lat, longitude: lng }).then(r => r.data);
export const nextQuestion = () => api.post("/game/next").then(r => r.data);
export const getStatus = () => api.get("/game/status").then(r => r.data);
export const getSummary = () => api.get("/game/summary").then(r => r.data);
export const getStats = () => api.get("/game/stats").then(r => r.data);
/** event verilirse o etkinligin tablosu (yalniz etkinlik araliginda biten oyunlar). */
export const getLeaderboard = (page = 1, event) =>
  api.get("/game/leaderboard", { params: event ? { page, event } : { page } }).then(r => r.data);
export const getEvents = () => api.get("/game/events").then(r => r.data.events);
