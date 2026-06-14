"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/app/actions/audit";

export type ApplyActionResult =
  | { success: true; warning?: string }
  | { error: string };

export type UpdateStatusResult = { success: true } | { error: string };

export type PlacementActionResult = { success: true } | { error: string };

const APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
] as const;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

function getNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  if (current === "submitted") return ["under_review"];
  if (current === "under_review") return ["accepted", "rejected"];
  return [];
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml({
  applicantName,
  applicantEmail,
  companyName,
  coverLetterHtml,
  resumeUrl,
  projectExperience,
}: {
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  coverLetterHtml: string;
  resumeUrl: string;
  projectExperience: string | null;
}): string {
  const year = new Date().getFullYear();
  const projectExperienceHtml = projectExperience
    ? `<p style="margin:0;font-size:15px;color:#334155;line-height:1.7;">${escapeHtml(projectExperience)}</p>`
    : `<p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;">Not provided.</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OJT Application – ${applicantName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#bfdbfe;font-weight:600;">OJT Recommender System</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">New OJT Application</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:#93c5fd;">Submitted via the OJT Student Recommendation Platform</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">
                Dear <strong style="color:#1e293b;">HR / Hiring Team of ${companyName}</strong>,
              </p>
              <p style="margin:12px 0 0 0;font-size:15px;color:#475569;line-height:1.6;">
                A student has submitted an OJT application through our platform. Please find the applicant's details and cover letter below.
              </p>
            </td>
          </tr>

          <!-- Applicant Info Card -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Applicant Name</p>
                    <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#1e293b;">${applicantName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Email Address</p>
                    <p style="margin:4px 0 0 0;font-size:15px;color:#1e293b;">
                      <a href="mailto:${applicantEmail}" style="color:#2563eb;text-decoration:none;">${applicantEmail}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Applying To</p>
                    <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#1e293b;">${companyName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cover Letter -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <h2 style="margin:0 0 12px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
                Cover Letter
              </h2>
              <div style="font-size:15px;color:#334155;line-height:1.7;">
                ${coverLetterHtml}
              </div>
            </td>
          </tr>

          <!-- Project Experience -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <h2 style="margin:0 0 12px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
                Project Experience
              </h2>
              ${projectExperienceHtml}
            </td>
          </tr>

          <!-- Resume -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <h2 style="margin:0 0 12px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
                Resume
              </h2>
              <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">
                The applicant's resume has been attached to this email. You may also
                <a href="${resumeUrl}" style="color:#2563eb;text-decoration:underline;"> view it online here</a>.
              </p>
            </td>
          </tr>

          <!-- CTA Divider -->
          <tr>
            <td style="padding:32px 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px 0;" />
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                To reply to this applicant, simply reply to this email — your response will be sent directly to <strong>${applicantEmail}</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This email was sent automatically by the <strong>OJT Recommender System</strong>.<br />
                &copy; ${year} OJT Recommender. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function applyToCompany(
  formData: FormData,
): Promise<ApplyActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in first." };

  const companyId = (formData.get("company_id") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const applicantEmail = (formData.get("email") as string)?.trim();
  const coverLetterHtml = (formData.get("cover_letter_html") as string) ?? "";

  if (!companyId) return { error: "Missing company ID." };
  if (!fullName) return { error: "Full name is required." };
  if (!applicantEmail) return { error: "Email is required." };
  if (!stripHtml(coverLetterHtml)) {
    return { error: "Please write your cover letter before submitting." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_path, resume_url")
    .eq("id", user.id)
    .single();

  if (!profile?.resume_path || !profile?.resume_url) {
    return { error: "Please upload your resume in Account Settings first." };
  }

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("project_exp")
    .eq("user_id", user.id)
    .single();

  const message = studentProfile?.project_exp?.trim() || null;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, email_address")
    .eq("id", companyId)
    .single();

  if (companyError || !company) return { error: "Company not found." };
  if (!company.email_address) {
    return { error: "This company has no email address configured." };
  }

  const resumeUrl = profile.resume_url;
  const storagePath = profile.resume_path;

  const { error: insertError } = await supabase
    .from("company_applications")
    .insert({
      company_id: company.id,
      user_id: user.id,
      applicant_name: fullName,
      applicant_email: applicantEmail,
      message,
      status: "submitted",
      resume_path: storagePath,
      resume_url: resumeUrl,
      cover_letter_html: coverLetterHtml,
    });

  if (insertError) {
    return { error: `Failed to save application: ${insertError.message}` };
  }

  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.APP_MAIL_FROM;

  if (!brevoApiKey) {
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning:
        "Application saved, but email was not sent. Set BREVO_API_KEY in environment.",
    };
  }

  if (!brevoApiKey.startsWith("xkeysib-")) {
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning:
        "Application saved, but email was not sent. BREVO_API_KEY must be a Brevo API key (xkeysib-...), not SMTP or another provider key.",
    };
  }

  if (!senderEmail) {
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning:
        "Application saved, but email was not sent. Set APP_MAIL_FROM to a verified sender in Brevo.",
    };
  }

  // Attach resume file
  const attachments: Array<{ name: string; content: string }> = [];
  let attachmentWarning: string | undefined;

  const resumeResponse = await fetch(resumeUrl);
  if (!resumeResponse.ok) {
    attachmentWarning =
      "Application saved, but email failed to attach the resume. Please contact the company directly.";
  } else {
    const resumeBuffer = await resumeResponse.arrayBuffer();
    attachments.push({
      name: storagePath.split("/").slice(-1)[0],
      content: toBase64(resumeBuffer),
    });
  }

  const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: "OJT Recommender",
      },
      to: [{ email: company.email_address, name: `HR Team – ${company.name}` }],
      replyTo: {
        email: applicantEmail,
        name: fullName,
      },
      subject: `OJT Application: ${fullName} – ${company.name}`,
      htmlContent: buildEmailHtml({
        applicantName: fullName,
        applicantEmail,
        companyName: company.name,
        coverLetterHtml,
        resumeUrl,
        projectExperience: message,
      }),
      attachment: attachments,
    }),
  });

  if (!emailResponse.ok) {
    const emailText = await emailResponse.text();
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning: `Application saved, but email failed: ${emailText}`,
    };
  }

  revalidatePath(`/companyDetails/${companyId}`);
  if (attachmentWarning) {
    return { success: true, warning: attachmentWarning };
  }
  return { success: true };
}

export async function updateApplicationStatus(
  formData: FormData,
): Promise<UpdateStatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in first." };

  const applicationId = (formData.get("application_id") as string)?.trim();
  const nextStatus = (formData.get("next_status") as string)?.trim() as
    | ApplicationStatus
    | undefined;

  if (!applicationId) return { error: "Missing application id." };
  if (!nextStatus || !APPLICATION_STATUSES.includes(nextStatus)) {
    return { error: "Invalid status." };
  }

  const { data: application, error } = await supabase
    .from("company_applications")
    .select("id, status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (error || !application) return { error: "Application not found." };

  const currentStatus = application.status as ApplicationStatus;
  if (!APPLICATION_STATUSES.includes(currentStatus)) {
    return { error: "Unknown current status." };
  }

  const allowedNext = getNextStatuses(currentStatus);
  if (!allowedNext.includes(nextStatus)) {
    return { error: "Invalid status transition." };
  }

  const { error: updateError } = await supabase
    .from("company_applications")
    .update({ status: nextStatus })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  await logAudit({
    actorId: user.id,
    action: "application.status.update",
    entityType: "company_application",
    entityId: applicationId,
    details: { from: currentStatus, to: nextStatus },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Final OJT placement + MOA/LOA + completion certificate
// ─────────────────────────────────────────────────────────────

/**
 * Marks one accepted application as the student's final OJT placement.
 * Enforced one-per-student via the unique user_id on ojt_placements.
 * Re-selecting a different company replaces the placement and clears any
 * previously-uploaded MOA/LOA and certificate (they no longer apply).
 */
export async function setFinalPlacement(
  formData: FormData,
): Promise<PlacementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in first." };

  const applicationId = (formData.get("application_id") as string)?.trim();
  if (!applicationId) return { error: "Missing application id." };

  const { data: application, error } = await supabase
    .from("company_applications")
    .select("id, status, company_id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (error || !application) return { error: "Application not found." };
  if (application.status !== "accepted") {
    return {
      error: "Only an accepted application can be set as final placement.",
    };
  }

  const { data: existing } = await supabase
    .from("ojt_placements")
    .select("id, application_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.application_id === applicationId) {
    return { success: true };
  }

  const placementRow = {
    user_id: user.id,
    application_id: application.id,
    company_id: application.company_id,
    // Clear documents whenever the placed company changes.
    moa_path: null,
    moa_url: null,
    certificate_path: null,
    certificate_url: null,
  };

  const { error: upsertError } = await supabase
    .from("ojt_placements")
    .upsert(placementRow, { onConflict: "user_id" });

  if (upsertError) return { error: upsertError.message };

  await logAudit({
    actorId: user.id,
    action: "placement.select",
    entityType: "ojt_placement",
    entityId: application.id,
    details: { company_id: application.company_id },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { success: true };
}

async function uploadPlacementFile(
  formData: FormData,
  {
    fieldName,
    bucket,
    prefix,
    pathColumn,
    urlColumn,
    auditAction,
  }: {
    fieldName: string;
    bucket: string;
    prefix: string;
    pathColumn: "moa_path" | "certificate_path";
    urlColumn: "moa_url" | "certificate_url";
    auditAction: string;
  },
): Promise<PlacementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in first." };

  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const { data: placement } = await supabase
    .from("ojt_placements")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!placement) {
    return { error: "Select your final OJT placement before uploading." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${prefix}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("ojt_placements")
    .update({ [pathColumn]: storagePath, [urlColumn]: publicUrl })
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  await logAudit({
    actorId: user.id,
    action: auditAction,
    entityType: "ojt_placement",
    entityId: placement.id,
    details: { path: storagePath },
  });

  revalidatePath("/dashboard/applications");
  return { success: true };
}

/** Uploads the signed MOA/LOA for the student's final placement. */
export async function uploadPlacementDocument(
  formData: FormData,
): Promise<PlacementActionResult> {
  return uploadPlacementFile(formData, {
    fieldName: "moa",
    bucket: "placement-documents",
    prefix: "moa",
    pathColumn: "moa_path",
    urlColumn: "moa_url",
    auditAction: "placement.moa.upload",
  });
}

/** Uploads the certificate of completion after the OJT finishes. */
export async function uploadCompletionCertificate(
  formData: FormData,
): Promise<PlacementActionResult> {
  return uploadPlacementFile(formData, {
    fieldName: "certificate",
    bucket: "completion-certificates",
    prefix: "certificate",
    pathColumn: "certificate_path",
    urlColumn: "certificate_url",
    auditAction: "placement.certificate.upload",
  });
}

/**
 * Records the required and rendered OJT hours for a student's final placement.
 * Coordinator-/superadmin-only: program-scoped access is enforced by RLS, this
 * action additionally rejects students. Hours feed the OJT completion reports.
 */
export async function updatePlacementHours(
  formData: FormData,
): Promise<PlacementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in first." };

  const { data: actor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (actor?.role !== "coordinator" && actor?.role !== "superadmin") {
    return { error: "Not authorized to edit OJT hours." };
  }

  const studentId = (formData.get("user_id") as string)?.trim();
  if (!studentId) return { error: "Missing student id." };

  const requiredRaw = (formData.get("required_hours") as string)?.trim();
  const renderedRaw = (formData.get("rendered_hours") as string)?.trim();
  const requiredHours = Number(requiredRaw);
  const renderedHours = Number(renderedRaw);

  if (
    !Number.isInteger(requiredHours) ||
    !Number.isInteger(renderedHours) ||
    requiredHours < 0 ||
    renderedHours < 0
  ) {
    return { error: "Hours must be whole numbers of zero or more." };
  }
  if (renderedHours > requiredHours) {
    return { error: "Rendered hours cannot exceed required hours." };
  }

  const { data: placement, error: lookupError } = await supabase
    .from("ojt_placements")
    .select("id")
    .eq("user_id", studentId)
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };
  if (!placement) {
    return { error: "This student has no final OJT placement yet." };
  }

  const { error: updateError } = await supabase
    .from("ojt_placements")
    .update({ required_hours: requiredHours, rendered_hours: renderedHours })
    .eq("user_id", studentId);

  if (updateError) return { error: updateError.message };

  await logAudit({
    actorId: user.id,
    action: "placement.hours.update",
    entityType: "ojt_placement",
    entityId: placement.id,
    details: { required_hours: requiredHours, rendered_hours: renderedHours },
  });

  revalidatePath(`/coordinator/students/${studentId}`);
  return { success: true };
}
