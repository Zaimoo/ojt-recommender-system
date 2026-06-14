"use client";

import { useState } from "react";
import { updatePlacementHours } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Props {
  userId: string;
  requiredHours: number;
  renderedHours: number;
}

export function PlacementHoursForm({
  userId,
  requiredHours,
  renderedHours,
}: Props) {
  const [required, setRequired] = useState(String(requiredHours));
  const [rendered, setRendered] = useState(String(renderedHours));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const requiredNum = Number(required) || 0;
  const renderedNum = Number(rendered) || 0;
  const isComplete = requiredNum > 0 && renderedNum >= requiredNum;
  const progress =
    requiredNum > 0 ? Math.min(100, (renderedNum / requiredNum) * 100) : 0;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const res = await updatePlacementHours(formData);
    setSaving(false);
    if ("error" in res) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "OJT hours saved." });
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          OJT Hours
        </p>
        <Badge variant={isComplete ? "success" : "warning"}>
          {isComplete ? "Hours complete" : "In progress"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Required Hours</Label>
          <Input
            name="required_hours"
            type="number"
            min={0}
            step={1}
            value={required}
            onChange={(e) => setRequired(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rendered Hours</Label>
          <Input
            name="rendered_hours"
            type="number"
            min={0}
            step={1}
            value={rendered}
            onChange={(e) => setRendered(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span className="font-medium text-slate-700">
            {renderedNum} / {requiredNum} hrs
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isComplete ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {msg && (
        <p
          className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}
        >
          {msg.text}
        </p>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {saving ? "Saving…" : "Save Hours"}
      </Button>
    </form>
  );
}
