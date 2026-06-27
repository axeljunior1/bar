import { z } from "zod";

import { formatNameInput, formatNoteInput } from "@/lib/utils/text";

export const slateIdSchema = z.string().uuid("Ardoise invalide.");

export const slateLineIdSchema = z.string().uuid("Ligne invalide.");

export const clientNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom client est requis.")
  .max(100, "100 caractères maximum.")
  .transform(formatNameInput);

export const slateNoteSchema = z
  .string()
  .trim()
  .max(300, "300 caractères maximum.")
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return formatNoteInput(value);
  });

export const slateLocationSchema = z
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

export const productPackagingIdSchema = z
  .string()
  .uuid("Conditionnement invalide.");

export const productVariantIdSchema = z
  .string()
  .uuid("Variante invalide.")
  .nullable()
  .optional();

export const paymentMethodIdSchema = z
  .string()
  .uuid("Moyen de paiement invalide.");

export const lineQuantitySchema = z.coerce
  .number()
  .int("Quantité entière requise.")
  .min(1, "Quantité minimale : 1.")
  .max(99, "Quantité maximale : 99.");

export const lineUnitPriceSchema = z.coerce
  .number({ message: "Prix invalide." })
  .min(0, "Le prix doit être positif ou nul.")
  .max(9999.99, "Prix trop élevé.");

export const lineLineTotalSchema = lineUnitPriceSchema;
