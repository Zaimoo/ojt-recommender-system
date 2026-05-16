"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyActionResult =
  | { success: true; warning?: string }
  | { error: string };

const MAX_COVER_LETTER_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
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
  const coverLetter = formData.get("cover_letter");

  if (!companyId) return { error: "Missing company ID." };
  if (!fullName) return { error: "Full name is required." };
  if (!applicantEmail) return { error: "Email is required." };
  if (!(coverLetter instanceof File) || coverLetter.size === 0) {
    return { error: "Please upload your cover letter." };
  }
  if (coverLetter.size > MAX_COVER_LETTER_SIZE_BYTES) {
    return {
      error: "Cover letter file is too large. Maximum allowed size is 8 MB.",
    };
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

  const coverSafeName = sanitizeFileName(coverLetter.name);
  const coverLetterPath = `${user.id}/cover-letter-${Date.now()}-${coverSafeName}`;

  const { error: coverUploadError } = await supabase.storage
    .from("candidate-resumes")
    .upload(coverLetterPath, coverLetter, {
      upsert: false,
      contentType: coverLetter.type || "application/octet-stream",
    });

  if (coverUploadError) {
    return { error: `Cover letter upload failed: ${coverUploadError.message}` };
  }

  const {
    data: { publicUrl: coverLetterUrl },
  } = supabase.storage.from("candidate-resumes").getPublicUrl(coverLetterPath);

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
      cover_letter_path: coverLetterPath,
      cover_letter_url: coverLetterUrl,
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

  let attachmentWarning: string | undefined;

  const resumeResponse = await fetch(resumeUrl);
  if (!resumeResponse.ok) {
    attachmentWarning =
      "Application saved, but email failed to attach the resume. Please contact the company directly.";
  }

  const coverResponse = await fetch(coverLetterUrl);
  if (!coverResponse.ok) {
    attachmentWarning =
      "Application saved, but email failed to attach the cover letter. Please contact the company directly.";
  }

  const attachments: Array<{ name: string; content: string }> = [];

  if (resumeResponse.ok) {
    const resumeBuffer = await resumeResponse.arrayBuffer();
    attachments.push({
      name: storagePath.split("/").slice(-1)[0],
      content: toBase64(resumeBuffer),
    });
  }

  if (coverResponse.ok) {
    const coverBuffer = await coverResponse.arrayBuffer();
    attachments.push({
      name: coverLetterPath.split("/").slice(-1)[0],
      content: toBase64(coverBuffer),
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
      to: [{ email: company.email_address }],
      replyTo: {
        email: applicantEmail,
        name: fullName,
      },
      subject: `New OJT Application - ${fullName}`,
      htmlContent: `
        <p><strong>Applicant:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${applicantEmail}</p>
        <p><strong>Company:</strong> ${company.name}</p>
        <p><strong>Project Experience:</strong> ${message ?? "(No project experience provided)"}</p>
        <p><strong>Resume URL:</strong> <a href="${resumeUrl}">${resumeUrl}</a></p>
        <p><strong>Cover Letter URL:</strong> <a href="${coverLetterUrl}">${coverLetterUrl}</a></p>
      `,
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
