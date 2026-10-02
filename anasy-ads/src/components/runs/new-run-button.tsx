"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, X } from "lucide-react";
import { createRun } from "@/app/actions/runs";

type Account = {
  id: string;
  platform: string;
  accountName: string | null;
  platformAccountId: string;
};

type RunType = "audit" | "report" | "setup" | "plan";

const RUN_TYPES: { value: RunType; label: string }[] = [
  { value: "audit",  label: "Auditoria" },
  { value: "report", label: "Relatório" },
  { value: "setup",  label: "Setup da conta" },
  { value: "plan",   label: "Plano de mídia" },
];

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

export function NewRunButton({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RunType>("audit");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createRun(type, accountId || undefined, notes.trim() || undefined);
      setOpen(false);
      setNotes("");
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo run
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold">Novo Run</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="run-type" className="text-sm font-medium">
                Tipo de run
              </label>
              <select
                id="run-type"
                value={type}
                onChange={(e) => setType(e.target.value as RunType)}
                className={inputClass}
              >
                {RUN_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {accounts.length > 0 ? (
              <div className="space-y-1.5">
                <label htmlFor="account-select" className="text-sm font-medium">
                  Conta de anúncios
                </label>
                <select
                  id="account-select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className={inputClass}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName ?? acc.platformAccountId} · {acc.platform.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2.5">
                Nenhuma conta conectada. Vá em{" "}
                <a
                  href="/dashboard/connections"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Conexões
                </a>{" "}
                para conectar uma conta antes de criar um run.
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="run-notes" className="text-sm font-medium">
                Notas{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="run-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções adicionais para o AI…"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm" disabled={isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || accounts.length === 0}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar run
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
