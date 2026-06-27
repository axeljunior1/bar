"use client";

import {
  createCategory,
  createPackagingType,
  createPaymentMethod,
  deactivateCategory,
  deactivatePackagingType,
  deactivatePaymentMethod,
  renameCategory,
  renamePackagingType,
  renamePaymentMethod,
} from "@/lib/actions/settings";

import {
  SettingsListManager,
  type SettingsListItem,
} from "@/components/settings/SettingsListManager";

export type SettingsEntity =
  | "categories"
  | "packaging_types"
  | "payment_methods";

const entityConfig = {
  categories: {
    addLabel: "Nouvelle catégorie",
    emptyLabel: "Aucune catégorie active",
    deactivateTitle: "Désactiver la catégorie ?",
    onCreate: createCategory,
    onRename: renameCategory,
    onDeactivate: deactivateCategory,
  },
  packaging_types: {
    addLabel: "Nouveau conditionnement",
    emptyLabel: "Aucun conditionnement actif",
    deactivateTitle: "Désactiver le conditionnement ?",
    onCreate: createPackagingType,
    onRename: renamePackagingType,
    onDeactivate: deactivatePackagingType,
  },
  payment_methods: {
    addLabel: "Nouveau moyen de paiement",
    emptyLabel: "Aucun moyen de paiement actif",
    deactivateTitle: "Désactiver le moyen de paiement ?",
    onCreate: createPaymentMethod,
    onRename: renamePaymentMethod,
    onDeactivate: deactivatePaymentMethod,
  },
} as const;

type SettingsListClientProps = {
  entity: SettingsEntity;
  items: SettingsListItem[];
};

export function SettingsListClient({ entity, items }: SettingsListClientProps) {
  const config = entityConfig[entity];

  return (
    <SettingsListManager
      items={items}
      addLabel={config.addLabel}
      emptyLabel={config.emptyLabel}
      deactivateTitle={config.deactivateTitle}
      onCreate={config.onCreate}
      onRename={config.onRename}
      onDeactivate={config.onDeactivate}
    />
  );
}
