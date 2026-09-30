"use client";

import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteMachine } from "./actions";

// REQ-MCH-07: asks for confirmation before deleting. The Server Action
// redirects to the list on success, or returns why the machine was kept.
export default function DeleteMachineButton({
  machineId,
  machineCode,
}: {
  machineId: string;
  machineCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMachine(machineId);
      if (result?.error) {
        setError(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={open}
        title={`Delete ${machineCode}?`}
        description="This cannot be undone. Machines with alarms or maintenance records cannot be deleted."
        confirmLabel={pending ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
