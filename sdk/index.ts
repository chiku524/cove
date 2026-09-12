export type CoveOptions = {
  apiKey: string;
  baseUrl?: string;
};

export type ChatInput = {
  message: string;
  conversationId?: string;
  metadata?: Record<string, string>;
};

export type Citation = {
  articleId: string;
  title: string;
  score: number;
};

export type ChatResult = {
  reply: string;
  conversationId: string;
  citations: Citation[];
  handoff: boolean;
  engine: "retrieval" | "llm";
};

export type SearchHit = {
  articleId: string;
  title: string;
  tags: string[];
  snippet: string;
  score: number;
};

export class CoveError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "CoveError";
    this.status = status;
    this.code = code;
  }
}

export class Cove {
  readonly apiKey: string;
  readonly baseUrl: string;

  constructor(options: CoveOptions) {
    if (!options.apiKey) throw new Error("Cove requires an apiKey");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
  }

  async chat(input: ChatInput): Promise<ChatResult> {
    return this.request<ChatResult>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async search(query: string, limit = 5): Promise<{ hits: SearchHit[] }> {
    return this.request("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  async conversation(id: string) {
    return this.request<{ conversation: unknown }>(
      `/api/v1/conversations/${encodeURIComponent(id)}`,
    );
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...init.headers,
      },
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    } & T;
    if (!response.ok) {
      throw new CoveError(
        data.message || `Cove request failed (${response.status})`,
        response.status,
        data.error,
      );
    }
    return data;
  }
}

export default Cove;
