import Image from "next/image";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/[0.08] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/images/obsidian-logo.png"
              alt="Obsidian Partners & Co."
              width={58}
              height={58}
              className="h-14 w-14 rounded-xl object-cover"
              priority
            />

            <div>
              <p className="text-lg font-semibold tracking-tight text-white">
                Aurelian
              </p>

              <p className="text-sm text-white/45">
                Executive Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.09]"
            aria-label="Open profile"
          >
            NV
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}