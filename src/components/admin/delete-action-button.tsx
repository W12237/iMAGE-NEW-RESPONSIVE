"use client";

import React, { useTransition } from "react";

interface DeleteActionButtonProps {
  id: string;
  name: string;
  action: (formData: FormData) => Promise<void>;
  label?: string;
}

export function DeleteActionButton({
  id,
  name,
  action,
  label = "Delete",
}: DeleteActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
          return;
        }
        startTransition(async () => {
          await action(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="danger"
        disabled={isPending}
        style={{ padding: "6px 12px", fontSize: "12px", opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? "Deleting..." : label}
      </button>
    </form>
  );
}
