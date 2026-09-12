"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotSettingsForm } from "@/components/bot-settings-form";
import { ChatPanel } from "@/components/chat-panel";
import { IntegratePanel } from "@/components/integrate-panel";
import { KnowledgeEditor } from "@/components/knowledge-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sampleQuestions } from "@/lib/questions";
import type { Bot } from "@/lib/types";

const TABS = ["chat", "knowledge", "integrate", "settings"] as const;
type Tab = (typeof TABS)[number];

function asTab(value: string | undefined, fallback: Tab): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : fallback;
}

export function BotWorkspace({
  bot,
  origin,
  initialTab,
}: {
  bot: Bot;
  origin: string;
  initialTab?: string;
}) {
  const router = useRouter();
  const fallback: Tab = bot.articles.length === 0 ? "knowledge" : "chat";
  const [tab, setTab] = useState<Tab>(asTab(initialTab, fallback));
  const [deleting, setDeleting] = useState(false);

  function changeTab(next: string) {
    const value = asTab(next, fallback);
    setTab(value);
    router.replace(`/dashboard/bots/${bot.id}?tab=${value}`, { scroll: false });
  }

  async function remove() {
    setDeleting(true);
    const response = await fetch(`/api/v1/bots/${bot.id}`, { method: "DELETE" });
    if (response.ok) router.push("/dashboard");
    setDeleting(false);
  }

  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="chat">Playground</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="integrate">Integrate</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost">Delete bot</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the bot, its articles, and conversation history.
                API keys stop working immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={remove}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <TabsContent value="chat">
        {bot.articles.length === 0 ? (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">This bot has no articles yet.</p>
            <p className="text-muted-foreground mt-1">
              Add knowledge first, or the playground can only greet and hand off.
            </p>
            <Button className="mt-3" size="sm" onClick={() => changeTab("knowledge")}>
              Add an article
            </Button>
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <ChatPanel
            apiKey={bot.apiKey}
            welcome={bot.welcomeMessage}
            botName={bot.name}
            suggestions={sampleQuestions(bot.articles)}
          />
          <aside className="grid content-start gap-4 text-sm">
            <p className="text-muted-foreground">
              {bot.articles.length} article
              {bot.articles.length === 1 ? "" : "s"} in the knowledge base.
              Answers cite the sources they used.
            </p>
            <p className="text-muted-foreground">
              Tone is {bot.tone}. Change it in Settings. Add
              AI_GATEWAY_API_KEY or OPENAI_API_KEY to generate replies with an
              LLM over the same articles.
            </p>
          </aside>
        </div>
      </TabsContent>
      <TabsContent value="knowledge">
        <KnowledgeEditor
          botId={bot.id}
          articles={bot.articles}
          onTryPlayground={() => changeTab("chat")}
        />
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
