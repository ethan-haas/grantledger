"use client";

import { useMemo } from "react";
import { Dialog } from "./dialog";
import { useModKey } from "@/hooks/use-mod-key";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

function buildShortcutGroups(mod: string) {
  return [
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["g", "d"], label: "Go to Dashboard" },
        { keys: ["g", "g"], label: "Go to Grants" },
        { keys: ["g", "s"], label: "Go to Settings" },
        { keys: ["g", "e"], label: "Go to Expenses" },
        { keys: ["g", "r"], label: "Go to Reports" },
        { keys: ["g", "i"], label: "Go to Import" },
      ],
    },
    {
      title: "Actions",
      shortcuts: [
        { keys: [mod, "N"], label: "New Grant" },
        { keys: [mod, "K"], label: "Command Palette" },
        { keys: ["?"], label: "Show Shortcuts" },
      ],
    },
  ];
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const mod = useModKey();
  const groups = useMemo(() => buildShortcutGroups(mod), [mod]);

  return (
    <Dialog open={open} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {group.title}
            </h3>
            <div className="space-y-1.5">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <span className="text-slate-700 dark:text-slate-300">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        {i > 0 && shortcut.keys.length > 1 && key.length === 1 && shortcut.keys[0].length === 1 && (
                          <span className="mx-0.5 text-xs text-slate-400">then</span>
                        )}
                        <kbd className="inline-flex min-w-[24px] items-center justify-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
