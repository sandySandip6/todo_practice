"use client";

import { register as registerUser } from '@/services/auth';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from 'next/link';

const SignupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser(data.username, data.email, data.password);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.response?.data) {
        // Build readable errors from Django API response
        const apiErrors = err.response.data;
        const msg = Object.keys(apiErrors)
          .map((key) => `${key}: ${apiErrors[key].join(", ")}`)
          .join(" | ");
        setError(msg || "Failed to create account. Please try again.");
      } else {
        setError("Something went wrong. Username or email might be taken.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300 hover:border-slate-700/60">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            ✓
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm mt-1.5">
            Get started with TaskFlow today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              placeholder="username"
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            {errors.username && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-2.5 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-lg p-2.5 text-xs text-center font-medium">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </div>
            ) : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-150">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
