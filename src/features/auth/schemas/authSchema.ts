import { z } from "zod";

export const authFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const nameFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export const otpFormSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type AuthFormData = z.infer<typeof authFormSchema>;
export type NameFormData = z.infer<typeof nameFormSchema>;
export type OtpFormData = z.infer<typeof otpFormSchema>;
