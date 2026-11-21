import { z } from "zod";

// Trim + lowercase first, THEN check the format (mobile keyboards often add a trailing space)
const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

// At least 8 chars, one letter and one number
export const passwordRule = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string({ error: "Reset link is invalid" }).min(20, "Reset link is invalid").max(200),
  password: passwordRule,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});
