"use client";

import { login } from '@/services/auth';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from 'next/link';

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await login(data.username, data.password);
      if (res && res.access) {
        localStorage.setItem("access_token", res.access);
        localStorage.setItem("refresh_token", res.refresh);
        localStorage.setItem("username", data.username);
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid response format from server.");
      }
    } catch (err) {
      console.error("Login component error:", err);
      setError("Invalid username or password");
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            ✓
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Sign in to access your task dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                {...register("username")}
                placeholder="Enter your username"
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-655 rounded-lg py-2.5 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            {errors.username && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-655 rounded-lg py-2.5 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 text-xs text-center font-medium animate-pulse">
              {error}
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
                Logging in...
              </div>
            ) : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {"Don't have an account? "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-150">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
