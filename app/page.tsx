import Link from "next/link";
import { Briefcase, GraduationCap, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      {/* Hero Section */}
      <div className="w-full bg-linear-to-b from-blue-50 via-white to-slate-50 px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Briefcase className="h-10 w-10 text-blue-600" />
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            OJT Recommender System
          </h1>

          <p className="mb-8 text-lg text-slate-600">
            Smart recommendations for your on-the-job training journey
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 px-8 text-sm font-medium text-white shadow-lg transition-colors hover:bg-sky-400"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto -mt-8 max-w-4xl px-4 pb-16">
        <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-slate-800">
              Smart Matching
            </h3>
            <p className="text-sm text-slate-600">
              AI-powered system to match your skills and interests with the
              right OJT opportunities.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-slate-800">
              Company Overview
            </h3>
            <p className="text-sm text-slate-600">
              Brief description about the company, their requirements, and
              eligible programs.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-slate-800">
              Coordinator Tools
            </h3>
            <p className="text-sm text-slate-600">
              OJT coordinators can manage company listings and view student
              registrations in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
