"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyActionResult = { success: true } | { error: string };
type ApplySuccess = { success: true; warning?: string };

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function applyToCompany(
  formData: FormData,
): Promise<ApplyActionResult | ApplySuccess> {
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.APP_MAIL_FROM;

  if (!resendApiKey) {
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning:
        "Application saved, but email was not sent. Set RESEND_API_KEY in environment.",
    };
  }

  if (!senderEmail) {
    revalidatePath(`/companyDetails/${companyId}`);
    return {
      success: true,
      warning:
        "Application saved, but email was not sent. Set APP_MAIL_FROM to a verified sender domain in Resend.",
    };
  }

  const resumeBuffer = await resume.arrayBuffer();
  const attachmentContent = toBase64(resumeBuffer);

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderEmail,
      to: [company.email_address],
      subject: `New OJT Application - ${fullName}`,
      html: `
        <p><strong>Applicant:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${applicantEmail}</p>
        <p><strong>Company:</strong> ${company.name}</p>
        <p><strong>Message:</strong> ${message ?? "(No message provided)"}</p>
      `,
      attachments: [
        {
          filename: resume.name,
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
