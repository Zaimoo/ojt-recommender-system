"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, LogIn, ChevronLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const notice =
    searchParams.get("deactivated") === "1"
      ? "Your coordinator account has been deactivated. Please contact the administrator."
      : null;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
        setPending(false);
      } else if (result?.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Brand panel ─── */}
      <div className="hidden flex-col justify-between bg-linear-to-br from-blue-700 to-blue-500 p-12 lg:flex lg:w-5/12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">
            OJT Recommender
          </span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Find your perfect
              <br />
              OJT company.
            </h1>
            <p className="text-blue-100 leading-relaxed">
              AI-powered recommendations that match your skills and program to
              the right partner companies.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Personalized company recommendations",
              "One-click application with cover letter",
              "Track all your applications in one place",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm text-blue-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-blue-200">
          © {new Date().getFullYear()} OJT Recommender System
        </p>
      </div>

      {/* ── Right: Login form ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">
              OJT Recommender
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {notice && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {notice}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-blue-600 text-sm font-semibold hover:bg-blue-700"
              disabled={pending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {pending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
