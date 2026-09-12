"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Article } from "@/lib/types";

const TEMPLATES = [
  {
    title: "Reset your password",
    tags: "account, password, login",
    body: "On the sign-in page, choose Forgot password and enter the email on the account. We send a reset link that expires in 30 minutes. SSO users should reset the password with their identity provider instead.",
  },
  {
    title: "Contact a human",
    tags: "handoff, support",
    body: "If the bot cannot help, email support@example.com with your workspace name and a short description. We reply within one business day.",
  },
  {
    title: "What this product is",
    tags: "overview, getting-started",
    body: "Write two or three sentences about who the product is for and the first thing a new customer should do after they sign up.",
  },
];

export function KnowledgeEditor({
  botId,
  articles,
  onTryPlayground,
}: {
  botId: string;
  articles: Article[];
  onTryPlayground?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter((article) =>
      [article.title, article.body, article.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [articles, query]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const payload = {
        title,
        body,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const url = editing
        ? `/api/v1/bots/${botId}/articles/${editing.id}`
        : `/api/v1/bots/${botId}/articles`;
      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Save failed");
      const wasEmpty = articles.length === 0 && !editing;
      setTitle("");
      setBody("");
      setTags("");
      setEditing(null);
      toast.success(editing ? "Article updated" : "Article added", {
        action:
          wasEmpty && onTryPlayground
            ? { label: "Try it", onClick: onTryPlayground }
            : undefined,
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function remove(article: Article) {
    const response = await fetch(
      `/api/v1/bots/${botId}/articles/${article.id}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      toast.error("Could not delete article");
      return;
    }
    if (editing?.id === article.id) {
      setEditing(null);
      setTitle("");
      setBody("");
      setTags("");
    }
    toast.success("Article deleted");
    router.refresh();
  }

  function startEdit(article: Article) {
    setEditing(article);
    setTitle(article.title);
    setBody(article.body);
    setTags(article.tags.join(", "));
  }

  function applyTemplate(template: (typeof TEMPLATES)[number]) {
    setEditing(null);
    setTitle(template.title);
    setBody(template.body);
    setTags(template.tags);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4 content-start">
        {articles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start from a template</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                Empty bots can only greet people. Add one article so answers
                have something to cite.
              </p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <Button
                    key={template.title}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? `Edit “${editing.title}”` : "Add an article"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Reset your password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Answer</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write the steps a customer should follow."
                  rows={10}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="account, password, login"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : editing ? "Save article" : "Add article"}
                </Button>
                {editing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null);
                      setTitle("");
                      setBody("");
                      setTags("");
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 content-start">
        {articles.length > 3 ? (
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter articles"
            aria-label="Filter articles"
          />
        ) : null}
        {articles.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              No articles yet. Use a template or write the first one.
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              No articles match that filter.
            </CardContent>
          </Card>
        ) : (
          visible.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-muted-foreground line-clamp-3 text-sm">
                  {article.body}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(article)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(article)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
