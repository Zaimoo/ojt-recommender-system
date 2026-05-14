"use client";

import { useRef, useState } from "react";
import { applyToCompany } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  companyId: string;
  companyName: string;
}

const MAX_COVER_LETTER_SIZE_BYTES = 8 * 1024 * 1024;

export function ApplyForm({ companyId, companyName }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">(
    "success",
  );

  function handleRequestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  async function handleConfirmApply() {
    if (!formRef.current) return;

    setPending(true);
    setStatus(null);
    setStatusType("success");

    const formData = new FormData(formRef.current);
    const coverLetter = formData.get("cover_letter");

    if (coverLetter instanceof File && coverLetter.size > 0) {
      if (coverLetter.size > MAX_COVER_LETTER_SIZE_BYTES) {
        setStatusType("error");
        setStatus(
          "Cover letter file is too large. Maximum allowed size is 8 MB.",
        );
        setPending(false);
        setConfirmOpen(false);
        return;
      }
    }

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
      <form ref={formRef} onSubmit={handleRequestSubmit} className="space-y-4">
        <input type="hidden" name="company_id" value={companyId} />

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" name="full_name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Short introduction for the company"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover_letter">Cover Letter (PDF/DOC)</Label>
          <Input
            id="cover_letter"
            name="cover_letter"
            type="file"
            accept=".pdf,.doc,.docx"
            required
          />
          <p className="text-xs text-slate-500">Maximum file size: 8 MB.</p>
        </div>

        <p className="text-xs text-slate-500">
          Your saved resume from Account Settings will be attached.
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
