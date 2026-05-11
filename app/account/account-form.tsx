"use client";

import { useState } from "react";
import { updateAccount } from "@/app/actions/account";
import { PROGRAM_OPTIONS } from "@/lib/constants/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types";

interface Props {
  profile: Profile | null;
}

export function AccountForm({ profile }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  async function handleSubmit(formData: FormData) {
    setStatus(null);
    setStatusType("success");

    const res = await updateAccount(formData);
    if ("error" in res) {
      setStatusType("error");
      setStatus(res.error);
      return;
    }

    setStatusType("success");
    setStatus("Account settings updated.");
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
              required
            />
          </div>

          {profile?.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID Number</Label>
              <Input
                id="student_id"
                name="student_id"
                defaultValue={profile?.student_id ?? ""}
                required
              />
            </div>
          )}

          {profile?.role === "coordinator" && (
            <div className="space-y-2">
              <Label htmlFor="assigned_program">Assigned Program</Label>
              <select
                id="assigned_program"
                name="assigned_program"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                defaultValue={profile?.program_id ?? ""}
                required
              >
                <option value="" disabled>
                  Select program
                </option>
                {PROGRAM_OPTIONS.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="Leave blank to keep current password"
            />
          </div>

          {status && (
            <p
              className={`rounded-md p-2 text-sm ${
                statusType === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {status}
            </p>
          )}

          <Button type="submit">Save Changes</Button>
        </CardContent>
      </form>
    </Card>
  );
}
