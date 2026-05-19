import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  Building2,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Our hybrid recommendation engine scores companies based on your technical skills and program eligibility — so you always see the most relevant matches first.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Building2,
    title: "Company Directory",
    description:
      "Browse detailed profiles for every partner company — overview, required skills, HR contact, location, and eligible programs — all in one place.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Users,
    title: "Coordinator Dashboard",
    description:
      "OJT coordinators can manage company listings, track student registrations, and monitor application activity in real time.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const highlights = [
  "Skill-based company recommendations",
  "Rich-text cover letter editor",
  "Direct email delivery to HR teams",
  "Full application history tracking",
  "Program eligibility matching",
  "Coordinator oversight dashboard",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* ── Navbar ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">OJT Recommender</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-6 py-28 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered OJT Recommendations
          </span>

          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find the right company<br className="hidden sm:block" /> for your OJT.
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-blue-100">
            The smarter way to match students with OJT partner companies —
            using AI, skill profiling, and program eligibility.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything you need for a successful OJT
            </h2>
            <p className="mt-3 text-slate-500">
              Built for students and coordinators at every step of the process.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ───────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start">
            {/* Left: text */}
            <div className="max-w-md lg:sticky lg:top-24">
              <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                Everything in one platform
              </h2>
              <p className="mb-8 text-slate-500 leading-relaxed">
                From discovering companies to submitting applications and tracking responses — OJT Recommender handles the whole workflow so you can focus on landing the right placement.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                Get started for free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: checklist */}
            <div className="flex-1 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
                >
                  <CheckCircle className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to find your OJT company?
          </h2>
          <p className="mb-8 text-blue-100">
            Join students and coordinators already using OJT Recommender.
          </p>
          <Link
            href="/register"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Briefcase className="h-4 w-4 text-blue-600" />
          <span>© {new Date().getFullYear()} OJT Recommender System. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
