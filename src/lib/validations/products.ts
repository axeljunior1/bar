import { z } from "zod";

export const productNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis.")
  .max(100, "100 caractères maximum.");

export const productIdSchema = z.string().uuid("Produit invalide.");

export const categoryIdSchema = z.string().uuid("Catégorie invalide.");

export const packagingTypeIdSchema = z
  .string()
  .uuid("Type de conditionnement invalide.");

export const packagingIdSchema = z
  .string()
  .uuid("Conditionnement invalide.");

export const unitPriceSchema = z.coerce
  .number({ message: "Prix unitaire invalide." })
  .min(0, "Le prix doit être positif ou nul.");

export const quantitySchema = z.coerce
  .number({ message: "Quantité invalide." })
  .positive("La quantité doit être supérieure à 0.");

export const optionalPriceSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  },
  z
    .coerce.number({ message: "Prix invalide." })
    .min(0, "Le prix doit être positif ou nul.")
    .nullable(),
);

export const productActiveSchema = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean(),
);
