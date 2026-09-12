export type Tone = "friendly" | "professional" | "concise";

export type Article = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

export type Bot = {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  welcomeMessage: string;
  handoffMessage: string;
  tone: Tone;
  apiKey: string;
  isDemo?: boolean;
  articles: Article[];
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
};

export type Conversation = {
  id: string;
  botId: string;
  messages: ChatMessage[];
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  articleId: string;
  title: string;
  score: number;
};

export type SearchHit = {
  article: Article;
  score: number;
  snippet: string;
};

export type ChatRequest = {
  message: string;
  conversationId?: string;
  metadata?: Record<string, string>;
};

export type ChatResponse = {
  reply: string;
  conversationId: string;
  citations: Citation[];
  suggestions: string[];
  handoff: boolean;
  engine: "retrieval" | "llm";
};

export type StoreData = {
  bots: Bot[];
  conversations: Conversation[];
};

export type CreateBotInput = {
  name: string;
  description?: string;
  instructions?: string;
  welcomeMessage?: string;
  handoffMessage?: string;
  tone?: Tone;
};

export type UpdateBotInput = Partial<
  Pick<
    Bot,
    | "name"
    | "description"
    | "instructions"
    | "welcomeMessage"
    | "handoffMessage"
    | "tone"
  >
>;

export type CreateArticleInput = {
  title: string;
  body: string;
  tags?: string[];
};
