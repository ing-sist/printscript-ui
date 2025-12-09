const env = (() => {
  try {
    // Vite/ESM runtime
    return (import.meta as any)?.env ?? {};
  } catch {
    // Cypress/Node runtime
    return process.env as Record<string, string | undefined>;
  }
})();

export const FRONTEND_URL = env.VITE_FRONTEND_URL ?? "http://localhost:80";
// Default targets nginx dev proxy at :8080, which routes /snippet/* to snippet-service
export const BACKEND_URL = env.VITE_BACKEND_URL ?? "http://localhost:8080/snippet";
export const AUTH0_USERNAME = env.VITE_AUTH0_USERNAME ?? "";
export const AUTH0_PASSWORD = env.VITE_AUTH0_PASSWORD ?? "";
