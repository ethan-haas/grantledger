"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUiStore } from "@/stores/ui-store";
import { trackEvent } from "@/lib/posthog";

interface GrantDetailActionsProps {
  grantId: string;
  grantName: string;
}

export function GrantDetailActions({ grantId, grantName }: GrantDetailActionsProps) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/grants/${grantId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete grant");
      }
      trackEvent("grant_deleted", { grant_id: grantId });
      addToast({ type: "success", title: "Grant deleted" });
      router.push("/dashboard/grants");
      router.refresh();
    } catch {
      addToast({ type: "error", title: "Failed to delete grant" });
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setShowDelete(true)}
        aria-label="Delete grant"
      >
        Delete
      </Button>
      <ConfirmDialog
        open={showDelete}
        title="Delete Grant"
        message={`Are you sure you want to delete "${grantName}"? This will also delete all associated expenses and budget data. This action cannot be undone.`}
        confirmLabel="Delete Grant"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
