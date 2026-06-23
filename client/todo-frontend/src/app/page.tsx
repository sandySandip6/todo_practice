"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TodoDashboard from "@/components/TodoDashboard";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated client-side after initial render
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace("/login");
      }
    };
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, [router]);

  // Loading skeleton screen while verifying auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <div className="absolute font-bold text-lg text-indigo-400">✓</div>
        </div>
        <p className="text-slate-400 text-sm tracking-wide animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  // If authenticated, render the dashboard
  if (isAuthenticated) {
    return <TodoDashboard />;
  }

  // While redirecting to login, render empty view to avoid flicker
  return null;
}
