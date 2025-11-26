export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL ?? "http://localhost:5173"
// Saco ruta fija al back usa ruta relativa de infra
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8082"
export const AUTH0_USERNAME = import.meta.env.VITE_AUTH0_USERNAME ?? ""
export const AUTH0_PASSWORD = import.meta.env.VITE_AUTH0_PASSWORD ?? ""