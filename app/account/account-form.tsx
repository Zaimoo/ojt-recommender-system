"use client";

import { useState } from "react";
import { updateAccount } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types";

interface Props {
  profile: Profile | null;
}

interface FieldErrors {
  contact_number?: string;
  student_id?: string;
  new_password?: string;
}

function validate(formData: FormData, role: string | undefined): FieldErrors {
  const errors: FieldErrors = {};
  const contactNumber = (formData.get("contact_number") as string)?.trim();
  const studentId = (formData.get("student_id") as string)?.trim();
  const newPassword = (formData.get("new_password") as string) ?? "";

  if (contactNumber) {
    const digits = contactNumber.replace(/\D/g, "");
    if (digits.length !== 11) {
      errors.contact_number =
        "Invalid format. Contact number should be 11 digits long.";
    }
  }

  if (role === "student" && studentId) {
    if (!/^\d{4}-\d{4}$/.test(studentId)) {
      errors.student_id =
        "Invalid format. Student ID should be YYYY-0000 (e.g. 2023-0001).";
    }
  }

  if (newPassword.trim().length > 0 && newPassword.trim().length < 6) {
    errors.new_password = "Password must be at least 6 characters long.";
  }

  return errors;
}

export function AccountForm({ profile }: Props) {
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    setSuccess(null);
    setServerError(null);

    const errors = validate(formData, profile?.role);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const res = await updateAccount(formData);
    if ("error" in res) {
      setServerError(res.error);
      return;
    }

    setSuccess("Account settings updated.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Account Settings</CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profile?.email ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              name="contact_number"
              placeholder="+63 9xx xxx xxxx"
              defaultValue={profile?.contact_number ?? ""}
              aria-invalid={!!fieldErrors.contact_number}
              onChange={() => clearFieldError("contact_number")}
            />
            {fieldErrors.contact_number ? (
              <p className="text-xs text-red-600">{fieldErrors.contact_number}</p>
            ) : (
              <p className="text-xs text-slate-400">11 digits, e.g. 09171234567</p>
            )}
          </div>

          {profile?.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID Number</Label>
              <Input
                id="student_id"
                name="student_id"
                placeholder="YYYY-0000"
                defaultValue={profile?.student_id ?? ""}
                aria-invalid={!!fieldErrors.student_id}
                onChange={() => clearFieldError("student_id")}
              />
              {fieldErrors.student_id ? (
                <p className="text-xs text-red-600">{fieldErrors.student_id}</p>
              ) : (
                <p className="text-xs text-slate-400">
                  Format: YYYY-0000 (e.g. 2023-0001)
                </p>
              )}
            </div>
          )}

          {profile?.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF/DOC)</Label>
              <Input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx"
              />
              {profile?.resume_url ? (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  View current resume
                </a>
              ) : (
                <p className="text-xs text-slate-500">No resume uploaded yet.</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="Leave blank to keep current password"
              aria-invalid={!!fieldErrors.new_password}
              onChange={() => clearFieldError("new_password")}
            />
            {fieldErrors.new_password ? (
              <p className="text-xs text-red-600">{fieldErrors.new_password}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Minimum 6 characters if changing.
              </p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
              {serverError}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <Button type="submit">Save Changes</Button>
        </CardContent>
      </form>
    </Card>
  );
}
