"use client";

import { useState } from "react";
import { applyToCompany } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  companyId: string;
  companyName: string;
}

export function ApplyModal({ companyId, companyName }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">(
    "success",
  );

  async function handleApply(formData: FormData) {
    setPending(true);
    setStatus(null);
    setStatusType("success");

    const res = await applyToCompany(formData);
    if ("error" in res) {
      setStatusType("error");
      setStatus(res.error);
      setPending(false);
      return;
    }

    if ("warning" in res && res.warning) {
      setStatusType("warning");
      setStatus(res.warning);
      setPending(false);
      return;
    }

    setStatusType("success");
    setStatus("Application sent successfully!");
    setPending(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Apply</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Apply to {companyName}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <form action={handleApply} className="space-y-4">
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
                <Label htmlFor="resume">CV / Resume</Label>
                <Input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                />
              </div>

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
          </div>
        </div>
      )}
    </>
  );
}
