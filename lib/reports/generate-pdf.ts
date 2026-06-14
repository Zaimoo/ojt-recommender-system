import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData, SkillCount } from "@/app/actions/reports";

// ── Palette (RGB) ─────────────────────────────────────────────
const INK: RGB = [15, 23, 42]; // slate-900
const SUB: RGB = [100, 116, 139]; // slate-500
const LINE: RGB = [203, 213, 225]; // slate-300
const BOX_BG: RGB = [248, 250, 252]; // slate-50
const BAR_BG: RGB = [241, 245, 249]; // slate-100
const BLUE: RGB = [37, 99, 235];
const EMERALD: RGB = [16, 185, 129];
const AMBER: RGB = [217, 119, 6];
const RED: RGB = [220, 38, 38];
const SLATE: RGB = [71, 85, 105];

type RGB = [number, number, number];

// jspdf-autotable assigns `lastAutoTable` on the doc at runtime, but the v5
// type defs don't expose it. This narrows the cast to just what we read.
type DocWithTable = jsPDF & { lastAutoTable?: { finalY?: number } };

interface Stat {
  label: string;
  value: string | number;
  color: RGB;
}

// A4 portrait in millimetres.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Cursor that tracks the y position and handles page breaks. */
class Cursor {
  doc: jsPDF;
  y = MARGIN;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  /** Add a new page if the next block of `h` mm would overflow. */
  ensure(h: number) {
    if (this.y + h > PAGE_H - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }
}

function drawHeader(doc: jsPDF, report: ReportData): Cursor {
  const cur = new Cursor(doc);
  const program =
    report.meta.program === "ALL" ? "All Programs" : report.meta.program;

  // Accent band.
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 4, "F");

  cur.y = MARGIN + 4;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("OJT Program Report", MARGIN, cur.y);

  cur.y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(
    `${program}  ·  ${formatDate(report.meta.startDate)} – ${formatDate(
      report.meta.endDate,
    )}`,
    MARGIN,
    cur.y,
  );

  cur.y += 5.5;
  doc.setFontSize(9);
  doc.setTextColor(...SUB);
  doc.text(
    `Generated ${formatDate(
      report.meta.generatedAt,
    )}  ·  OJT Company Recommendation System`,
    MARGIN,
    cur.y,
  );

  cur.y += 4;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, cur.y, PAGE_W - MARGIN, cur.y);
  cur.y += 8;
  return cur;
}

function sectionHeading(cur: Cursor, title: string, subtitle?: string) {
  cur.ensure(subtitle ? 16 : 12);
  const { doc } = cur;

  // Accent tab.
  doc.setFillColor(...BLUE);
  doc.rect(MARGIN, cur.y - 3.5, 1.4, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN + 4, cur.y);
  cur.y += subtitle ? 5 : 6;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SUB);
    doc.text(subtitle, MARGIN + 4, cur.y);
    cur.y += 5;
  }
}

function drawStatRow(cur: Cursor, stats: Stat[]) {
  const gap = 4;
  const boxH = 20;
  const boxW = (CONTENT_W - gap * (stats.length - 1)) / stats.length;
  cur.ensure(boxH + 3);
  const { doc } = cur;
  const top = cur.y;

  stats.forEach((stat, i) => {
    const x = MARGIN + i * (boxW + gap);
    doc.setFillColor(...BOX_BG);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, top, boxW, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...stat.color);
    doc.text(String(stat.value), x + 5, top + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SUB);
    doc.text(stat.label, x + 5, top + 15.5, {
      maxWidth: boxW - 8,
    });
  });

  cur.y = top + boxH + 6;
}

function drawSkillBars(cur: Cursor, skills: SkillCount[]) {
  const { doc } = cur;
  if (skills.length === 0) {
    cur.ensure(7);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...SUB);
    doc.text("No skills recorded.", MARGIN + 4, cur.y);
    cur.y += 7;
    return;
  }

  const max = Math.max(...skills.map((s) => s.count), 1);
  const rowH = 8.5;

  skills.forEach((s) => {
    cur.ensure(rowH);
    const top = cur.y;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(s.skill, MARGIN + 4, top + 2.5, { maxWidth: CONTENT_W - 20 });

    doc.setTextColor(...SLATE);
    doc.text(String(s.count), PAGE_W - MARGIN, top + 2.5, { align: "right" });

    // Track + fill.
    const barY = top + 4;
    const barW = CONTENT_W - 4;
    doc.setFillColor(...BAR_BG);
    doc.roundedRect(MARGIN + 4, barY, barW, 2.4, 1.2, 1.2, "F");
    doc.setFillColor(...BLUE);
    doc.roundedRect(MARGIN + 4, barY, (barW * s.count) / max, 2.4, 1.2, 1.2, "F");

    cur.y = top + rowH;
  });
  cur.y += 1;
}

function drawFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SUB);
    doc.text("OJT Company Recommendation System", MARGIN, PAGE_H - 8);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 8, {
      align: "right",
    });
  }
}

/**
 * Builds a custom, multi-page A4 PDF from the report data and triggers a
 * download. The layout is drawn from the data (not a screenshot of the page),
 * so it stays clean regardless of the on-screen UI.
 */
export function downloadReportPdf(report: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const cur = drawHeader(doc, report);

  // 1. Student Overview
  sectionHeading(
    cur,
    "1. Student Overview",
    "Students enrolled in OJT during the selected period",
  );
  drawStatRow(cur, [
    { label: "Enrolled in OJT", value: report.studentOverview.enrolled, color: BLUE },
    { label: "Completed OJT", value: report.studentOverview.completed, color: EMERALD },
    { label: "Did Not Complete", value: report.studentOverview.notCompleted, color: AMBER },
  ]);

  // 2. Company Placement Summary
  sectionHeading(
    cur,
    "2. Company Placement Summary",
    `${report.companyPlacement.companiesParticipated} ${
      report.companyPlacement.companiesParticipated === 1
        ? "company"
        : "companies"
    } where students were placed`,
  );
  if (report.companyPlacement.perCompany.length === 0) {
    cur.ensure(7);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...SUB);
    doc.text("No students were placed in this period.", MARGIN + 4, cur.y);
    cur.y += 8;
  } else {
    autoTable(doc, {
      startY: cur.y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Company", "Students Placed"]],
      body: report.companyPlacement.perCompany.map((c) => [
        c.company,
        String(c.count),
      ]),
      styles: { fontSize: 9, cellPadding: 2.5, textColor: INK },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], halign: "left" },
      alternateRowStyles: { fillColor: BOX_BG },
      columnStyles: { 1: { halign: "right", cellWidth: 40 } },
      theme: "grid",
    });
    cur.y = ((doc as DocWithTable).lastAutoTable?.finalY ?? cur.y) + 8;
  }

  // 3. Application Summary
  sectionHeading(
    cur,
    "3. Application Summary",
    "Applications submitted during the selected period",
  );
  drawStatRow(cur, [
    { label: "Total Submitted", value: report.applications.total, color: SLATE },
    { label: "Accepted", value: report.applications.accepted, color: EMERALD },
    { label: "Rejected", value: report.applications.rejected, color: RED },
    { label: "Pending", value: report.applications.pending, color: AMBER },
  ]);

  // 4. OJT Completion Summary
  sectionHeading(
    cur,
    "4. OJT Completion Summary",
    "Based on rendered vs. required hours recorded per placement",
  );
  drawStatRow(cur, [
    { label: "Completed Required Hours", value: report.ojtCompletion.completedHours, color: EMERALD },
    { label: "Incomplete Hours", value: report.ojtCompletion.incompleteHours, color: AMBER },
    { label: "Avg. Hours Rendered", value: report.ojtCompletion.averageHours, color: BLUE },
  ]);

  // 5. Most Common Student Skills
  sectionHeading(
    cur,
    "5. Most Common Student Skills",
    "Submitted by students placed this period",
  );
  drawSkillBars(cur, report.skills.topStudentSkills);

  // 6. Most In-Demand Company Skills
  sectionHeading(
    cur,
    "6. Most In-Demand Company Skills",
    "Required across participating companies",
  );
  drawSkillBars(cur, report.skills.topCompanySkills);

  drawFooters(doc);

  const program =
    report.meta.program === "ALL" ? "All-Programs" : report.meta.program;
  doc.save(
    `OJT-Report_${program}_${report.meta.startDate}_to_${report.meta.endDate}.pdf`,
  );
}
