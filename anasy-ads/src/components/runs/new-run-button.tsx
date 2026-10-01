"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronDown } from "lucide-react";
import { createRun } from "@/app/actions/runs";

const RUN_TYPES = [
  { value: "audit",  label: "Auditoria" },
  { value: "report", label: "Relatório" },
  { value: "setup",  label: "Setup da conta" },
  { value: "plan",   label: "Plano de mídia" },
] as const;

type RunType = (typeof RUN_TYPES)[number]["value"];

export function NewRunButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(type: RunType) {
    setOpen(false);
    startTransition(async () => {
      await createRun(type);
    });
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Novo run
        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-popover shadow-md py-1">
            {RUN_TYPES.map(({ value, label }) => (
              <button
                key={value}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleSelect(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
