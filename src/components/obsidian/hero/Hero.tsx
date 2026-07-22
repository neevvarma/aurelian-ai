"use client";

import { animate, createScope, stagger } from "animejs";
import { Clock3, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  ConversationView,
  type SavedConversation,
} from "../conversation/ConversationView";
import { CapabilityGrid } from "./CapabilityGrid";
import { CommandCenter } from "./CommandCenter";

const STORAGE_KEY = "aurelian.saved-conversations.v1";

function createTitle(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  return cleaned.length <= 58 ? cleaned : `${cleaned.slice(0, 55)}...`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function Hero() {
  const root = useRef<HTMLElement | null>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedConversation[];
        if (Array.isArray(parsed)) {
          setConversations(parsed);
        }
      }
    } catch (error) {
      console.warn("Aurelian could not load saved conversation history.", error);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.warn("Aurelian could not save conversation history.", error);
    }
  }, [conversations, historyLoaded]);

  useEffect(() => {
    if (!root.current || activeConversation) return;

    const scope = createScope({ root }).add(() => {
      animate("[data-hero-item]", {
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 750,
        delay: stagger(110),
        ease: "outExpo",
      });

      animate("[data-command-center]", {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.985, 1],
        duration: 900,
        delay: 420,
        ease: "outExpo",
      });

      animate("[data-capability-card]", {
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 700,
        delay: stagger(90, { start: 620 }),
        ease: "outExpo",
      });
    });

    return () => scope.revert();
  }, [activeConversation]);

  function toggleTool(tool: string) {
    setSelectedTools((currentTools) =>
      currentTools.includes(tool)
        ? currentTools.filter((currentTool) => currentTool !== tool)
        : [...currentTools, tool],
    );
  }

  function selectCapability(nextPrompt: string, tools: string[]) {
    setPrompt(nextPrompt);
    setSelectedTools(tools);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitPrompt() {
    const cleanedPrompt = prompt.trim();
    if (!cleanedPrompt) return;

    const now = new Date().toISOString();
    const newConversation: SavedConversation = {
      id: crypto.randomUUID(),
      title: createTitle(cleanedPrompt),
      originalPrompt: cleanedPrompt,
      selectedTools,
      createdAt: now,
      updatedAt: now,
      turns: [],
    };

    setConversations((current) => [newConversation, ...current]);
    setActiveConversationId(newConversation.id);
  }

  function startNewAnalysis() {
    setPrompt("");
    setSelectedTools([]);
    setActiveConversationId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateConversation(updatedConversation: SavedConversation) {
    setConversations((current) =>
      [
        updatedConversation,
        ...current.filter((conversation) => conversation.id !== updatedConversation.id),
      ].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
      ),
    );
  }

  function deleteConversation(conversationId: string) {
    setConversations((current) =>
      current.filter((conversation) => conversation.id !== conversationId),
    );

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }

  if (activeConversation) {
    return (
      <ConversationView
        key={activeConversation.id}
        conversation={activeConversation}
        onBack={startNewAnalysis}
        onConversationChange={updateConversation}
      />
    );
  }

  return (
    <section ref={root} className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-amber-100/[0.05] blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.009)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.009)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-white/[0.02] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div
            data-hero-item
            className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100/20 bg-amber-100/[0.055] shadow-[0_0_70px_rgba(255,225,170,0.09)]"
          >
            <Sparkles className="h-7 w-7 text-amber-100" />
          </div>

          <p
            data-hero-item
            className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-100/55"
          >
            Aurelian Intelligence
          </p>

          <h1
            data-hero-item
            className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
          >
            Bring clarity to complexity.
          </h1>

          <p
            data-hero-item
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60"
          >
            Describe the decision in front of you. Aurelian will help research,
            interpret, structure, and evaluate the path forward.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <CommandCenter
            value={prompt}
            selectedTools={selectedTools}
            onValueChange={setPrompt}
            onToolToggle={toggleTool}
            onSubmit={submitPrompt}
          />
        </div>

        <div className="mt-8">
          <CapabilityGrid onSelect={selectCapability} />
        </div>

        {conversations.length > 0 && (
          <section className="mx-auto mt-10 max-w-5xl rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/70 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/55">
                  Saved locally
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Recent analyses</h2>
              </div>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/35">
                {conversations.length}
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {conversations.slice(0, 8).map((conversation) => (
                <div
                  key={conversation.id}
                  className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2 transition hover:border-amber-100/15 hover:bg-amber-100/[0.025]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-white/75">
                      {conversation.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-white/30">
                      <Clock3 className="h-3 w-3" />
                      {formatHistoryDate(conversation.updatedAt)}
                      <span>•</span>
                      {conversation.turns.length} {conversation.turns.length === 1 ? "answer" : "answers"}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${conversation.title}`}
                    onClick={() => deleteConversation(conversation.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-red-300/[0.07] hover:text-red-200/70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-sm text-white/30">
          Aurelian may produce imperfect information. Verify critical decisions
          and source material.
        </p>
      </div>
    </section>
  );
}