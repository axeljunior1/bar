import { z } from "zod";

export const authEmailSchema = z
  .string()
  .trim()
  .min(1, "L'email est requis.")
  .email("Email invalide.")
  .transform((value) => value.toLowerCase());

export const newPasswordSchema = z
  .string()
  .min(8, "8 caractères minimum.");

export const confirmPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
