"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyActionResult =
  | { success: true; warning?: string }
  | { error: string };

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function buildEmailHtml({
  applicantName,
  applicantEmail,
  companyName,
  coverLetterHtml,
  resumeUrl,
}: {
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  coverLetterHtml: string;
  resumeUrl: string;
}): string {
  const year = new Date().getFullYear();
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
