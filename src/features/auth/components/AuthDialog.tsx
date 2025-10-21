"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Mail, Shield, ArrowLeft } from "lucide-react";
import {
  authFormSchema,
  nameFormSchema,
  otpFormSchema,
  AuthFormData,
  NameFormData,
  OtpFormData,
} from "../schemas/authSchema";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string, name: string) => void;
}

export function AuthDialog({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthDialogProps) {
  const [step, setStep] = useState<"email" | "otp" | "name">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const emailForm = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleEmailSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);
    setUserEmail(data.email);

    try {
      console.log("Sending OTP to:", data.email);

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP");
      }

      console.log("OTP sent successfully:", result);

      // Show success toast
      toast.success("Code sent! Check your email for the verification code");

      // Check if this is an existing user or new user
      setIsExistingUser(result.isExistingUser || false);
      setStep("otp");
    } catch (err) {
      console.error("Error sending OTP:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again.";
      setError(errorMessage);
      toast.error(`Failed to send code: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Verifying OTP:", data.otp);

      const email = emailForm.getValues("email");
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: data.otp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify OTP");
      }

      console.log("OTP verified successfully:", result);

      // Show success toast
      toast.success(
        `Email verified! ${isExistingUser ? "Welcome back!" : "Account created successfully"}`
      );

      // Store the user session data for client-side use
      if (result.user) {
        const sessionData = {
          user: result.user,
          access_token: "otp_verified",
          expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };

        localStorage.setItem("supabase_session", JSON.stringify(sessionData));
        console.log("User session stored locally:", result.user);
      }

      // Check if this is a new user who needs to provide their name
      if (!isExistingUser) {
        setStep("name");
      } else {
        // For existing users, check if we have their name from the API response
        const userName = result.user?.name;

        if (userName) {
          // User has a name in the database, sign them in
          onAuthSuccess(email, userName);
          onClose();
        } else {
          // No name found in database, treat as new user and collect name
          setStep("name");
        }
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to verify OTP. Please try again.";
      setError(errorMessage);
      toast.error(`Verification failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const email = emailForm.getValues("email");
      console.log("Resending OTP to:", email);

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend OTP");
      }

      console.log("OTP resent successfully:", result);

      // Show success toast
      toast.success(
        "Verification code sent! Check your email for the new code"
      );
    } catch (err) {
      console.error("Error resending OTP:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend OTP. Please try again.";
      setError(errorMessage);
      toast.error(`Failed to resend code: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (data: NameFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the user's name in the database
      const response = await fetch("/api/update-user-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user name");
      }

      // Show success toast
      toast.success(
        `Welcome to SafeCast! Hello ${data.name}, your account is ready`
      );

      // Store the user's name for future use
      localStorage.setItem("userName", data.name);

      // Close dialog and trigger success callback
      onAuthSuccess(userEmail, data.name);
      onClose();
    } catch (err) {
      console.error("Error updating user name:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update user name. Please try again.";
      setError(errorMessage);
      toast.error(`Failed to update name: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setIsExistingUser(null);
    otpForm.reset();
    setError(null);
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, ""); // Remove non-digits

    if (pastedData.length === 6) {
      otpForm.setValue("otp", pastedData);
      // Auto-submit after a short delay to allow the form to update
      setTimeout(() => {
        if (!isLoading) {
          handleOtpSubmit({ otp: pastedData });
        }
      }, 100);
    } else if (pastedData.length > 0) {
      // If pasted data is not exactly 6 digits, just set what we can
      otpForm.setValue("otp", pastedData.slice(0, 6));
    }
  };

  const handleClose = () => {
    setStep("email");
    setUserEmail("");
    setIsExistingUser(null);
    setError(null);
    emailForm.reset();
    nameForm.reset();
    otpForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "email" ? (
              <>
                <Mail className="h-5 w-5 text-gray-600" />
                Join SafeCast Community
              </>
            ) : step === "otp" ? (
              <>
                <Shield className="h-5 w-5 text-gray-600" />
                {isExistingUser ? "Sign In" : "Verify Your Email"}
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-gray-600" />
                Complete Your Profile
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to get started. We'll send you a verification code."
              : step === "otp"
                ? isExistingUser
                  ? "We've sent a 6-digit verification code to your email address to sign you in."
                  : "We've sent a 6-digit verification code to your email address to verify your account."
                : "Please provide your name to complete your account setup."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <form
            onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...emailForm.register("email")}
                placeholder="your@email.com"
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white shadow-lg"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        ) : step === "otp" ? (
          <form
            onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label className="text-center block">Verification Code</Label>
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code or paste it from your email
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpForm.watch("otp")}
                  onChange={(value) => otpForm.setValue("otp", value)}
                  onPaste={handleOtpPaste}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-red-600 text-center">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
              <p className="text-xs text-gray-500 text-center">
                Code sent to {emailForm.getValues("email")}
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !otpForm.watch("otp") ||
                  otpForm.watch("otp")?.length !== 6
                }
                className="w-full bg-black hover:bg-gray-800 text-white shadow-lg"
              >
                {isLoading
                  ? "Verifying..."
                  : isExistingUser
                    ? "Sign In"
                    : "Create Account"}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToEmail}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Resend Code
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Didn&apos;t receive the code? Check your spam folder or try again.
            </p>
          </form>
        ) : (
          <form
            onSubmit={nameForm.handleSubmit(handleNameSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                {...nameForm.register("name")}
                placeholder="John Doe"
              />
              {nameForm.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {nameForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white shadow-lg"
            >
              Complete Setup
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
