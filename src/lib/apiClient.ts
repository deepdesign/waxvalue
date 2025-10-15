// API Client for waxvalue - Real Discogs Integration Only
// No mock data - uses real Discogs API and user sessions

export type RepriceScope = 'global' | 'selection' | 'item';

export type Decision =
  | 'auto_applied'   // automation enabled; increase ≤ threshold; safeguards passed
  | 'user_applied'   // explicitly approved by user in this call
  | 'flagged'        // needs manual approval (decrease, large increase, or safeguard violation)
  | 'declined'       // user declined change
  | 'simulated';     // dry run only

export interface RepriceRequest {
  scope?: RepriceScope;
  filters?: Record<string, unknown>;           // used when scope === 'selection'
  listing_id?: number;                         // used when scope === 'item'
  approved_listing_ids?: number[];             // explicit user approvals in this call
  params?: Record<string, unknown>;            // per-run overrides (offsets, etc.)
}

export interface RepriceItemResult {
  listing_id: number;
  old_price: number;
  new_price: number;
  currency: string;                            // must match seller currency on Discogs
  decision: Decision;
  reason: string;                              // human-readable rationale or safeguard note
  confidence: number;                          // 0.0 – 1.0
  discogs_status?: string | null;
  http_status?: number | null;                 // omitted in dry runs
  ratelimit_remaining?: string | null;
  ratelimit_reset?: string | null;
}

export interface RepriceResponse {
  run_id: number;                              // audit id on the server
  dry_run: boolean;
  summary: {
    scanned: number;
    auto_applied: number;
    user_applied: number;
    flagged: number;
    declined: number;
    errors: number;
  };
  items: RepriceItemResult[];
}

export interface ApiError {
  detail: string;
}

export class ApiClient {
  private baseUrl: string;
  private sessionId: string | null;

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl;
    this.sessionId = typeof window !== 'undefined' ? localStorage.getItem('waxvalue_session_id') : null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Add session ID to query parameters
    if (this.sessionId) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}session_id=${encodeURIComponent(this.sessionId)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error: ApiError = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch (parseError) {
        // If response is not JSON (e.g., HTML error page), get text content
        try {
          const textContent = await response.text();
          errorMessage = textContent || errorMessage;
        } catch (textError) {
          // Fallback to status message
          errorMessage = `HTTP error! status: ${response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async setupAuth() {
    return this.request('/auth/setup', {
      method: 'POST',
    });
  }

  async verifyAuth(verification: {
    requestToken: string;
    requestTokenSecret: string;
    verifierCode: string;
  }) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(verification),
    });
  }

  async disconnectAuth() {
    return this.request('/auth/disconnect', {
      method: 'POST',
    });
  }

  // Dashboard endpoints
  async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  async simulate(request: RepriceRequest) {
    return this.request('/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Inventory endpoints
  async getSuggestions() {
    return this.request('/inventory/suggestions');
  }

  async applySuggestion(listingId: number, newPrice?: number) {
    const sessionId = localStorage.getItem('waxvalue_session_id');
    return this.request(`/inventory/apply/${listingId}?session_id=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ newPrice }),
    });
  }

  async declineSuggestion(listingId: number) {
    return this.request(`/inventory/decline/${listingId}`, {
      method: 'POST',
    });
  }

  async bulkApply(listingIds: number[]) {
    const sessionId = localStorage.getItem('waxvalue_session_id');
    return this.request(`/inventory/bulk-apply?session_id=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    });
  }

  async bulkDecline(listingIds: number[]) {
    return this.request('/inventory/bulk-decline', {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    });
  }


  // Settings endpoints
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Generic HTTP methods for wanted list and other features
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, { method: 'GET' });
    return { data: result };
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: result };
  }

  async put<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: result };
  }

  async delete<T = any>(endpoint: string): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, { method: 'DELETE' });
    return { data: result };
  }

}