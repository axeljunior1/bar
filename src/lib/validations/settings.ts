import { z } from "zod";

export const settingsNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis.")
  .max(100, "100 caractères maximum.");

export const settingsIdSchema = z.string().uuid("Identifiant invalide.");

export type SettingsNameInput = z.infer<typeof settingsNameSchema>;
