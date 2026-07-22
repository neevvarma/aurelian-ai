"use client";

import type {
  RecentResearchItem,
} from "@/types/research";

type SidebarProps = {
  recentResearch: RecentResearchItem[];
  isOpen: boolean;
  onClose: () => void;
  onNewResearch: () => void;
  onSelectResearch: (
    item: RecentResearchItem,
  ) => void;
};

function AurelianMark() {
  return (
    <div
      className="aurelian-mark"
      aria-hidden="true"
    >
      A
    </div>
  );
}

export function Sidebar({
  recentResearch,
  isOpen,
  onClose,
  onNewResearch,
  onSelectResearch,
}: SidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          "sidebar",
          isOpen ? "sidebar-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar-header">
          <div className="brand-lockup">
            <AurelianMark />

            <div>
              <div className="brand-name">
                Aurelian
              </div>

              <div className="brand-caption">
                Research intelligence
              </div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          className="new-research-button"
          onClick={onNewResearch}
        >
          <span aria-hidden="true">＋</span>
          New research
        </button>

        <div className="sidebar-section">
          <div className="sidebar-section-label">
            Recent research
          </div>

          <div className="recent-research-list">
            {recentResearch.length === 0 ? (
              <div className="empty-history">
                Your recent research will
                appear here.
              </div>
            ) : (
              recentResearch.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="recent-research-item"
                  onClick={() =>
                    onSelectResearch(item)
                  }
                >
                  <span
                    className="recent-research-icon"
                    aria-hidden="true"
                  >
                    ◇
                  </span>

                  <span className="recent-research-copy">
                    <span className="recent-research-title">
                      {item.title}
                    </span>

                    <span className="recent-research-date">
                      {new Date(
                        item.createdAt,
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status-row">
            <span className="status-dot" />
            Tavily research online
          </div>

          <div className="sidebar-version">
            Aurelian Preview
          </div>
        </div>
      </aside>
    </>
  );
}