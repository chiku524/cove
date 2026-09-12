"use client";

import { useRouter } from "next/navigation";
import { BotSettingsForm } from "@/components/bot-settings-form";
import { ChatPanel } from "@/components/chat-panel";
import { IntegratePanel } from "@/components/integrate-panel";
import { KnowledgeEditor } from "@/components/knowledge-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bot } from "@/lib/types";

export function BotWorkspace({ bot, origin }: { bot: Bot; origin: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm(`Delete ${bot.name}? This cannot be undone.`)) return;
    const response = await fetch(`/api/v1/bots/${bot.id}`, { method: "DELETE" });
    if (response.ok) router.push("/dashboard");
  }

  return (
    <Tabs defaultValue="chat" className="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="chat">Playground</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="integrate">Integrate</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Button variant="ghost" onClick={remove}>
          Delete bot
        </Button>
      </div>
      <TabsContent value="chat">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <ChatPanel apiKey={bot.apiKey} welcome={bot.welcomeMessage} />
          <aside className="text-muted-foreground grid content-start gap-3 text-sm">
            <p>
              {bot.articles.length} article
              {bot.articles.length === 1 ? "" : "s"} in the knowledge base.
              Answers cite the sources they used.
            </p>
            <p>
              Tone is {bot.tone}. Change it in Settings, or add an
              AI_GATEWAY_API_KEY / OPENAI_API_KEY to generate replies with an
              LLM over the same articles.
            </p>
          </aside>
        </div>
      </TabsContent>
      <TabsContent value="knowledge">
        <KnowledgeEditor botId={bot.id} articles={bot.articles} />
      </TabsContent>
      <TabsContent value="integrate">
        <IntegratePanel bot={bot} origin={origin} />
      </TabsContent>
      <TabsContent value="settings">
        <BotSettingsForm bot={bot} />
      </TabsContent>
    </Tabs>
  );
}
