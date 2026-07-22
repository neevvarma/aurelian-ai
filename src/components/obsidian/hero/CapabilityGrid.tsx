import {
  BarChart3,
  FileSearch,
  Globe2,
  Lightbulb,
} from "lucide-react";

type CapabilityGridProps = {
  onSelect: (prompt: string, tools: string[]) => void;
};

const capabilities = [
  {
    category: "Intelligence",
    title: "Research",
    description:
      "Investigate markets, competitors, industries, and emerging opportunities.",
    prompt:
      "Research a market, industry, or competitor and identify its most important trends, risks, and opportunities.",
    tools: ["Web", "Deep Research"],
    icon: Globe2,
  },
  {
    category: "Decision Support",
    title: "Strategy",
    description:
      "Turn complex objectives into structured plans and decisive next steps.",
    prompt:
      "Help me evaluate a business objective and develop a structured strategy with priorities, risks, and next steps.",
    tools: ["Web", "Internal Knowledge"],
    icon: Lightbulb,
  },
  {
    category: "Knowledge",
    title: "Documents",
    description:
      "Interpret reports, proposals, PDFs, and internal business information.",
    prompt:
      "Review my documents and extract the key findings, risks, decisions, and recommended next steps.",
    tools: ["Documents", "Internal Knowledge"],
    icon: FileSearch,
  },
  {
    category: "Performance",
    title: "Analysis",
    description:
      "Identify patterns, risks, and opportunities hidden within your results.",
    prompt:
      "Analyze my business performance and identify meaningful patterns, weaknesses, risks, and opportunities.",
    tools: ["Internal Knowledge"],
    icon: BarChart3,
  },
];

export function CapabilityGrid({ onSelect }: CapabilityGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {capabilities.map((capability) => {
        const Icon = capability.icon;

        return (
          <button
            key={capability.title}
            type="button"
            data-capability-card
            onClick={() => onSelect(capability.prompt, capability.tools)}
            className="group min-h-52 rounded-2xl border border-white/[0.09] bg-[#0d0d0d]/75 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-amber-100/25 hover:bg-[#151515]"
          >
            <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Icon className="h-5 w-5 text-amber-100/65 transition group-hover:text-amber-100" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
              {capability.category}
            </p>

            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {capability.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {capability.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}