import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type LegalPdfInput = {
  clubName: string;
  memberCode: string;
  memberName: string;
  dateOfBirth: string | null;
  idNumber: string | null;
  legalText: string;
  signaturePngBytes: Uint8Array;
};

export async function generateLegalMembershipPdf(input: LegalPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let cursorY = height - margin;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  // --- Header
  page.drawText(input.clubName, {
    x: margin, y: cursorY, size: 18, font: helvBold, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Issued: ${today}`, {
    x: width - margin - helv.widthOfTextAtSize(`Issued: ${today}`, 10),
    y: cursorY + 4, size: 10, font: helv, color: rgb(0.4, 0.4, 0.4),
  });
  cursorY -= 14;
  page.drawText("Membership consent", {
    x: margin, y: cursorY, size: 11, font: helv, color: rgb(0.4, 0.4, 0.4),
  });
  cursorY -= 24;

  // --- Member identity block
  const fields: [string, string][] = [
    ["Member code", input.memberCode],
    ["Full name", input.memberName || "—"],
    ["Date of birth", input.dateOfBirth ?? "—"],
    ["ID number", input.idNumber ?? "—"],
  ];
  for (const [label, value] of fields) {
    page.drawText(label, { x: margin, y: cursorY, size: 9, font: helv, color: rgb(0.45, 0.45, 0.45) });
    page.drawText(value, { x: margin + 110, y: cursorY, size: 11, font: helvBold, color: rgb(0.1, 0.1, 0.1) });
    cursorY -= 18;
  }
  cursorY -= 8;

  // --- Legal text block (wrapped)
  cursorY -= 6;
  page.drawText("Terms", {
    x: margin, y: cursorY, size: 11, font: helvBold, color: rgb(0.2, 0.2, 0.2),
  });
  cursorY -= 16;
  const legalLines = wrapText(input.legalText, helv, 10, width - 2 * margin);
  for (const line of legalLines) {
    if (cursorY < margin + 200) break; // leave room for signature
    page.drawText(line, { x: margin, y: cursorY, size: 10, font: helv, color: rgb(0.15, 0.15, 0.15) });
    cursorY -= 14;
  }

  // --- Signature image (anchored near the bottom)
  const sigImg = await pdf.embedPng(input.signaturePngBytes);
  const sigMaxW = 200;
  const sigMaxH = 80;
  const ratio = Math.min(sigMaxW / sigImg.width, sigMaxH / sigImg.height);
  const sigW = sigImg.width * ratio;
  const sigH = sigImg.height * ratio;
  const sigY = margin + 60;
  page.drawText("Member signature", {
    x: margin, y: sigY + sigH + 8, size: 9, font: helv, color: rgb(0.45, 0.45, 0.45),
  });
  page.drawImage(sigImg, { x: margin, y: sigY, width: sigW, height: sigH });
  page.drawLine({
    start: { x: margin, y: sigY - 4 },
    end: { x: margin + sigMaxW, y: sigY - 4 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  // --- Footer
  const footer = `${input.memberCode} · ${input.clubName}`;
  page.drawText(footer, {
    x: margin, y: margin / 2, size: 8, font: helv, color: rgb(0.5, 0.5, 0.5),
  });

  return pdf.save();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (paragraph.trim() === "") {
      out.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}
