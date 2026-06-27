"use client";

import { useState, useTransition } from "react";

import type { SettingsActionResult } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";

export type SettingsListItem = {
  id: string;
  name: string;
};

type SettingsListManagerProps = {
  items: SettingsListItem[];
  addLabel: string;
  emptyLabel: string;
  deactivateTitle: string;
  onCreate: (name: string) => Promise<SettingsActionResult>;
  onRename: (id: string, name: string) => Promise<SettingsActionResult>;
  onDeactivate: (id: string) => Promise<SettingsActionResult>;
};

export function SettingsListManager({
  items,
  addLabel,
  emptyLabel,
  deactivateTitle,
  onCreate,
  onRename,
  onDeactivate,
}: SettingsListManagerProps) {
  const [listError, setListError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDeactivate, setPendingDeactivate] =
    useState<SettingsListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMutation(result: SettingsActionResult, onSuccess?: () => void) {
    if (!result.success) {
      setListError(result.error ?? "Une erreur est survenue.");
      return;
    }

    setListError(null);
    onSuccess?.();
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();

    if (!name) {
      setListError("Le nom est requis.");
      return;
    }

    startTransition(async () => {
      const result = await onCreate(name);
      handleMutation(result, () => setNewName(""));
    });
  }

  function startEditing(item: SettingsListItem) {
    setEditingId(item.id);
    setEditingName(item.name);
    setListError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  function handleRename(itemId: string) {
    const name = editingName.trim();

    if (!name) {
      setListError("Le nom est requis.");
      return;
    }

    startTransition(async () => {
      const result = await onRename(itemId, name);
      handleMutation(result, cancelEditing);
    });
  }

  function handleDeactivateConfirm() {
    if (!pendingDeactivate) {
      return;
    }

    const itemId = pendingDeactivate.id;

    startTransition(async () => {
      const result = await onDeactivate(itemId);
      handleMutation(result, () => setPendingDeactivate(null));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <Input
          label={addLabel}
          name="name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nom"
          autoComplete="off"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !newName.trim()}>
          Ajouter
        </Button>
      </form>

      {listError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {listError}
        </p>
      ) : null}

      {!items.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
          <p className="text-muted">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border bg-white p-4"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Renommer"
                      name={`rename-${item.id}`}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      autoComplete="off"
                      disabled={isPending}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        size="md"
                        onClick={() => handleRename(item.id)}
                        disabled={isPending || !editingName.trim()}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={cancelEditing}
                        disabled={isPending}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 flex-1 truncate text-lg font-medium">
                      {item.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      fullWidth={false}
                      className="min-w-20 shrink-0"
                      onClick={() => startEditing(item)}
                      disabled={isPending}
                    >
                      Renommer
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      fullWidth={false}
                      className="min-w-20 shrink-0"
                      onClick={() => setPendingDeactivate(item)}
                      disabled={isPending}
                    >
                      Retirer
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        title={deactivateTitle}
        message={
          pendingDeactivate
            ? `« ${pendingDeactivate.name} » sera masqué. L'historique existant est conservé.`
            : ""
        }
        confirmLabel="Désactiver"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setPendingDeactivate(null)}
        pending={isPending}
      />
    </div>
  );
}
