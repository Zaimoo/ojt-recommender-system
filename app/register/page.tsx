"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidContactNumber,
  isValidStudentId,
  CONTACT_NUMBER_HINT,
  STUDENT_ID_HINT,
} from "@/lib/validation";
import { Briefcase, UserPlus, MailCheck, ChevronLeft } from "lucide-react";

interface FieldErrors {
  contact_number?: string;
  student_id?: string;
}

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    const contactNumber = (formData.get("contact_number") as string)?.trim();
    const studentId = (formData.get("student_id") as string)?.trim();

    const errors: FieldErrors = {};
    if (contactNumber && !isValidContactNumber(contactNumber)) {
      errors.contact_number = `Invalid format. ${CONTACT_NUMBER_HINT}`;
    }
    if (studentId && !isValidStudentId(studentId)) {
      errors.student_id = `Invalid format. ${STUDENT_ID_HINT}`;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setPending(true);
    setError(null);
    try {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
        setPending(false);
      } else if (result?.redirectTo) {
        setRegisteredEmail(formData.get("email") as string);
        setPending(false);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">
            OJT Recommender
          </span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Start your OJT
              <br />
              journey today.
            </h1>
            <p className="text-blue-100 leading-relaxed">
              Create your profile, add your skills, and let the system find the
              best companies for your program.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Free to use for students & coordinators",
              "AI skill-based matching engine",
              "Direct email application to HR teams",
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

      {/* ── Right: Register form ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">
              OJT Recommender
            </span>
          </div>

          {registeredEmail ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <MailCheck className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  Check your email
                </h2>
                <p className="text-sm text-slate-500">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-slate-700">
                    {registeredEmail}
                  </span>
                  . Click the link in that email to activate your account.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:underline"
                  onClick={() => setRegisteredEmail(null)}
                >
                  try again
                </Link>
                .
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Create account
            </h2>
            <p className="text-sm text-slate-500">
              Fill in your details to get started
            </p>
          </div>

          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="text-sm font-medium text-slate-700"
              >
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Juan Dela Cruz"
                required
                className="h-11"
              />
            </div>

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
                minLength={6}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="contact_number"
                className="text-sm font-medium text-slate-700"
              >
                Contact Number
              </Label>
              <Input
                id="contact_number"
                name="contact_number"
                placeholder="+63 966 368 5824"
                required
                aria-invalid={!!fieldErrors.contact_number}
                onChange={() => clearFieldError("contact_number")}
                className="h-11"
              />
              {fieldErrors.contact_number ? (
                <p className="text-xs text-red-600">
                  {fieldErrors.contact_number}
                </p>
              ) : (
                <p className="text-xs text-slate-400">{CONTACT_NUMBER_HINT}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="student_id"
                className="text-sm font-medium text-slate-700"
              >
                Student ID Number
              </Label>
              <Input
                id="student_id"
                name="student_id"
                placeholder="2022-1894"
                required
                aria-invalid={!!fieldErrors.student_id}
                onChange={() => clearFieldError("student_id")}
                className="h-11"
              />
              {fieldErrors.student_id ? (
                <p className="text-xs text-red-600">{fieldErrors.student_id}</p>
              ) : (
                <p className="text-xs text-slate-400">{STUDENT_ID_HINT}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-blue-600 text-sm font-semibold hover:bg-blue-700"
              disabled={pending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {pending ? "Creating account…" : "Register"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
