"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";

export function KeyboardShortcutsProvider() {
  const { showHelp, closeHelp } = useKeyboardShortcuts();

  return <KeyboardShortcutsDialog open={showHelp} onClose={closeHelp} />;
}
