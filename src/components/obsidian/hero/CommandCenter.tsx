"use client";

import {
  ArrowUp,
  BookOpen,
  FileText,
  Globe2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommandCenterProps = {
  value: string;
  selectedTools: string[];
  onValueChange: (value: string) => void;
  onToolToggle: (tool: string) => void;
  onSubmit: () => void;
};

const tools = [
  {
    label: "Web",
    icon: Globe2,
  },
  {
    label: "Documents",
    icon: FileText,
  },
  {
    label: "Deep Research",
    icon: Search,
  },
  {
    label: "Internal Knowledge",
    icon: BookOpen,
  },
];

export function CommandCenter({
  value,
  selectedTools,
  onValueChange,
  onToolToggle,
  onSubmit,
}: CommandCenterProps) {
  const canSubmit = value.trim().length > 0;

  return (
    <div
      data-command-center
      className="rounded-[28px] border border-white/[0.14] bg-[#121212]/95 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
    >
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (canSubmit) {
              onSubmit();
            }
          }
        }}
        placeholder="Describe the decision, challenge, or opportunity..."
        className="min-h-36 resize-none border-0 bg-transparent px-3 py-3 text-lg leading-8 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
      />

      <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTools.includes(tool.label);

            return (
              <button
                key={tool.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToolToggle(tool.label)}
                className={
                  isSelected
                    ? "flex items-center gap-2 rounded-xl border border-amber-100/30 bg-amber-100/[0.1] px-3 py-2 text-sm text-amber-50 transition"
                    : "flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 py-2 text-sm text-white/55 transition hover:border-amber-100/25 hover:bg-white/[0.07] hover:text-white"
                }
              >
                <Icon className="h-4 w-4" />
                {tool.label}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="h-11 gap-2 rounded-xl bg-amber-100 px-5 text-black hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Analyze
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}