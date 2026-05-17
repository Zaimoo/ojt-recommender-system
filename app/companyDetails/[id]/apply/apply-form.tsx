"use client";

import { useState } from "react";
import { applyToCompany } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Props {
  companyId: string;
  companyName: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function ApplyForm({ companyId, companyName }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">(
    "success",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetterHtml, setCoverLetterHtml] = useState("");

  function handleRequestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripHtml(coverLetterHtml)) {
      setStatusType("error");
      setStatus("Please write your cover letter before submitting.");
      return;
    }

    setStatus(null);
    setConfirmOpen(true);
  }

  async function handleConfirmApply() {
    setPending(true);
    setStatus(null);
    setStatusType("success");

    const formData = new FormData();
    formData.set("company_id", companyId);
    formData.set("full_name", fullName);
    formData.set("email", email);
    formData.set("cover_letter_html", coverLetterHtml);

    const res = await applyToCompany(formData);

    if ("error" in res) {
      setStatusType("error");
      setStatus(res.error);
      setPending(false);
      setConfirmOpen(false);
      return;
    }

    if ("warning" in res && res.warning) {
      setStatusType("warning");
      setStatus(res.warning);
      setPending(false);
      setConfirmOpen(false);
      return;
    }

    setStatusType("success");
    setStatus("Application sent successfully!");
    setPending(false);
    setConfirmOpen(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleRequestSubmit} className="space-y-4">
        <input type="hidden" name="company_id" value={companyId} />

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Cover Letter</Label>
          <RichTextEditor
            value={coverLetterHtml}
            onChange={setCoverLetterHtml}
            placeholder="Write your cover letter here. Introduce yourself, highlight your skills, and explain why you're a great fit for this company..."
            minHeight="220px"
          />
        </div>

        <p className="text-xs text-slate-500">
          Your saved resume from Account Settings will be attached automatically.
        </p>

        {status && (
          <p
            className={`rounded-md p-2 text-sm ${
              statusType === "error"
                ? "bg-red-50 text-red-700"
                : statusType === "warning"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {status}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Submit Application"}
        </Button>
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirm application
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              You are about to submit your application to {companyName}.
              Continue?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmApply}
                disabled={pending}
              >
                {pending ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
