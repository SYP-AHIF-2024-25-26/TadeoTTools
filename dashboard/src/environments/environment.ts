export const environment = {
  production: true,
  apiBaseUrl: (window as any).__env?.API_URL || "http://localhost:5000/v1"
};
