// British English spelling and hyphenated copy as requested.
// Typed client for Discogs Auto-Repricer API – aligns with openapi/paths/reprice.yaml

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
  strategy_id?: string;                        // server-known strategy id
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
  status: 'error';
  error: string;
  detail?: string;
}

// ---------- Basic fetch wrapper ----------

export interface ApiClientOptions {
  baseUrl?: string;                // e.g. '/api' if proxied, or 'http://localhost:8000'
  timeoutMs?: number;              // soft timeout for UI cancellations
  fetchImpl?: typeof fetch;        // DI for tests
}

export class ApiClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private timeoutMs: number;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? '/api').replace(/\/+$/, '');
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    this.timeoutMs = opts.timeoutMs ?? 30000;
  }

  // Helper to build query strings safely
  private qs(params: Record<string, string | number | boolean | undefined>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : '';
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('Request timed out')), this.timeoutMs);
      p.then(v => { clearTimeout(id); resolve(v); }).catch(e => { clearTimeout(id); reject(e); });
    });
  }

  private async json<T>(res: Response): Promise<T> {
    const text = await res.text();
    try { return JSON.parse(text) as T; }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }

  private async handle<T>(res: Response): Promise<T> {
    if (res.ok) return this.json<T>(res);
    // Try to parse structured error first
    let parsed: ApiError | undefined;
    try { parsed = await this.json<ApiError>(res); } catch { /* fall through */ }
    if (parsed?.status === 'error') {
      const msg = parsed.detail ? `${parsed.error}: ${parsed.detail}` : parsed.error;
      throw new Error(msg);
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}`); // generic
  }

  // ---------- Endpoints ----------

  /**
   * POST /reprice
   * Applies approved updates (or simulates, if dry_run=true) and returns decisions per item.
   *
   * @param body   RepriceRequest payload
   * @param opts   { dry_run, scope } query params
   */
  async reprice(
    body: RepriceRequest,
    opts?: { dry_run?: boolean; scope?: RepriceScope }
  ): Promise<RepriceResponse> {
    const url = `${this.baseUrl}/reprice${this.qs({
      dry_run: opts?.dry_run ?? true,
      scope: opts?.scope ?? body.scope ?? 'global',
    })}`;

    const resP = this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Do NOT add auth tokens here; the server talks to Discogs with server-side OAuth.
      body: JSON.stringify(body),
    });

    return this.withTimeout(this.handle<RepriceResponse>(await resP));
  }

  /**
   * POST /simulate (optional convenience if you expose a dedicated route)
   * Identical to reprice with dry_run=true; provided for semantic clarity in the UI.
   */
  async simulate(body: RepriceRequest, scope?: RepriceScope): Promise<RepriceResponse> {
    return this.reprice(body, { dry_run: true, scope });
  }
}




