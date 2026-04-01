"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyActionResult =
  | { success: true; warning?: string }
  | { error: string };

const MAX_RESUME_SIZE_BYTES = 8 * 1024 * 1024;

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
  const message = (formData.get("message") as string)?.trim() || null;
  const resume = formData.get("resume");

  if (!companyId) return { error: "Missing company ID." };
  if (!fullName) return { error: "Full name is required." };
  if (!applicantEmail) return { error: "Email is required." };
  if (!(resume instanceof File) || resume.size === 0) {
    return { error: "Please upload your CV/Resume." };
  }
  if (resume.size > MAX_RESUME_SIZE_BYTES) {
    return { error: "Resume file is too large. Maximum allowed size is 8 MB." };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, email_address")
    .eq("id", companyId)
    .single();

  if (companyError || !company) return { error: "Company not found." };
  if (!company.email_address) {
    return { error: "This company has no email address configured." };
  }

  const safeName = sanitizeFileName(resume.name);
  const storagePath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("candidate-resumes")
    .upload(storagePath, resume, {
      upsert: false,
      contentType: resume.type || "application/octet-stream",
    });

  if (uploadError)
    return { error: `Resume upload failed: ${uploadError.message}` };

  const {
    data: { publicUrl: resumeUrl },
  } = supabase.storage.from("candidate-resumes").getPublicUrl(storagePath);

  const { error: insertError } = await supabase
    .from("company_applications")
    .insert({
      company_id: company.id,
      user_id: user.id,
      applicant_name: fullName,
      applicant_email: applicantEmail,
      message,
      resume_path: storagePath,
      resume_url: resumeUrl,
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

  const resumeBuffer = await resume.arrayBuffer();
  const attachmentContent = toBase64(resumeBuffer);

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
        <p><strong>Message:</strong> ${message ?? "(No message provided)"}</p>
        <p><strong>Resume URL:</strong> <a href="${resumeUrl}">${resumeUrl}</a></p>
      `,
      attachment: [
        {
          name: resume.name,
          content: attachmentContent,
        },
      ],
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
  return { success: true };
}
