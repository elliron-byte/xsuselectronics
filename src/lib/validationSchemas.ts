import { z } from 'zod';

export const registrationSchema = z.object({
  phone: z.string()
    .length(10, "Phone must be 10 digits")
    .regex(/^(020|024|025|026|027|050|054|055|056|059)/, "Invalid phone prefix")
    .regex(/^\d+$/, "Phone must contain only numbers"),
  email: z.string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  captcha: z.string().length(4, "Invalid captcha"),
  invitationCode: z.string().length(5).regex(/^\d+$/, "Invalid invitation code").optional().or(z.literal(''))
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
