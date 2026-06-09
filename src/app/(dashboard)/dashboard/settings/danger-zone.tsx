"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useUiStore } from "@/stores/ui-store";

interface DangerZoneProps {
  orgId: string;
}

export function DangerZone({ orgId }: DangerZoneProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const addToast = useUiStore((s) => s.addToast);

  const confirmValue = orgId.slice(0, 12) || "DELETE";

  async function handleDelete() {
    if (confirmText !== confirmValue) return;
    setDeleting(true);
    try {
      addToast({
        type: "warning",
        title: "Organization deletion is not yet available. Contact support.",
      });
      setDialogOpen(false);
    } finally {
      setDeleting(false);
      setConfirmText("");
    }
  }

  return (
    <>
      <Card className="!border-danger-200 dark:!border-danger-900/50">
        <CardTitle className="!text-danger-700 dark:!text-danger-400">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible and destructive actions.
        </CardDescription>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-danger-200 bg-danger-50/50 px-4 py-3 dark:border-danger-800 dark:bg-danger-900/20">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Delete this organization
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently delete all grants, expenses, and data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            Delete Organization
          </Button>
        </div>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setConfirmText(""); }}
        title="Delete Organization"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action is permanent and cannot be undone. All grants, expenses,
            team members, and audit logs will be permanently deleted.
          </p>
          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-danger-600 dark:bg-slate-800 dark:text-danger-400">{confirmValue}</code> to confirm
            </label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmValue}
              className="mt-1"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setDialogOpen(false); setConfirmText(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== confirmValue}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete Organization
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
