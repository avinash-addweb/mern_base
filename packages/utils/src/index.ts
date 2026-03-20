export function formatDate(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  getRefreshToken?: () => string | null;
  onRefresh?: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
  onAuthFailure?: () => void;
}

export function createApiClient(config: ApiClientConfig) {
  let isRefreshing = false;

  async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${config.baseUrl}${endpoint}`;
    const token = config.getToken();
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });

    if (response.status === 401 && config.onRefresh && config.getRefreshToken && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshToken = config.getRefreshToken();
        if (refreshToken) {
          await config.onRefresh(refreshToken);
          isRefreshing = false;
          // Retry with new token
          return apiFetch<T>(endpoint, options);
        }
      } catch {
        isRefreshing = false;
        config.onAuthFailure?.();
        throw new Error("Session expired");
      }
      isRefreshing = false;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  return apiFetch;
}
