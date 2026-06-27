import { z } from "zod";

import { formatNameInput } from "@/lib/utils/text";

export const barIdSchema = z.string().uuid("Bar invalide.");

export const barNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom du bar est requis.")
  .max(100, "100 caractères maximum.")
  .transform(formatNameInput);

export const ownerEmailSchema = z
  .string()
  .trim()
  .min(1, "L'email owner est requis.")
  .email("Email invalide.")
  .transform((value) => value.toLowerCase());

export const ownerNameSchema = z
  .string()
  .trim()
  .max(100, "100 caractères maximum.")
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return formatNameInput(value);
  });
