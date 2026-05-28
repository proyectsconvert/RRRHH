import jsPDF from 'jspdf';

// Dark navy color from Convertia branding
const DARK = { r: 26, g: 46, b: 59 };   // #1a2e3b
const TEAL = { r: 0, g: 168, b: 150 };  // #00a896 (Convertia teal)

async function getLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/favicon-convertia.png');
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateRejectionPDF(jobTitle: string): Promise<string> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 22;

  // ── CORNER DECORATIONS ──────────────────────────────────────────────────────
  // Top-left quarter circle
  doc.setFillColor(DARK.r, DARK.g, DARK.b);
  doc.circle(-8, -8, 48, 'F');
  doc.circle(-8, -8, 36, 'F');

  // Bottom-right quarter circle
  doc.circle(W + 8, H + 8, 48, 'F');
  doc.circle(W + 8, H + 8, 36, 'F');

  // ── LOGO ────────────────────────────────────────────────────────────────────
  const logoBase64 = await getLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', W / 2 - 8, 14, 16, 16);
  }

  // "convertia" brand text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(TEAL.r, TEAL.g, TEAL.b);
  doc.text('convertia', W / 2, 36, { align: 'center' });

  // ── TITLE ───────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  const title = '¡Valoramos tu interés y confianza\nal ser parte de este proceso!';
  doc.text(title, W / 2, 52, { align: 'center', lineHeightFactor: 1.4 });

  // Thin divider
  doc.setDrawColor(TEAL.r, TEAL.g, TEAL.b);
  doc.setLineWidth(0.4);
  doc.line(margin, 66, W - margin, 66);

  // ── LETTER BODY ─────────────────────────────────────────────────────────────
  const maxWidth = W - margin * 2;
  let y = 78;

  const addParagraph = (text: string, bold = false, size = 10.5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 5;
  };

  // Greeting
  addParagraph('¡Hola!', true, 11);
  y += 1;

  // Paragraph 1
  addParagraph(
    `Queremos agradecerte sinceramente por tu participación en el proceso de selección para el puesto de ${jobTitle}. Fue un gusto conocer tu perfil y trayectoria.`
  );
  y += 2;

  // Paragraph 2
  addParagraph(
    'Luego de una evaluación detallada, hemos optado por continuar con otro/a candidato/a cuyo perfil se ajusta de manera más específica a las necesidades actuales del rol. Esta decisión no desmerece en absoluto tu experiencia ni tus capacidades, las cuales valoramos y reconocemos.'
  );
  y += 2;

  // Paragraph 3
  addParagraph(
    'Esperamos poder considerar tu candidatura en futuras oportunidades. Te deseamos lo mejor en tus próximos desafíos profesionales.'
  );
  y += 6;

  // Closing
  addParagraph('Cordialmente,', false, 10.5);
  y += 2;

  // ── SIGNATURE ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text('Ashley Coy', margin, y);
  y += 7;

  // Signature underline
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 2, margin + 38, y - 2);
  y += 2;

  // ── FOOTER INFO ─────────────────────────────────────────────────────────────
  const footerItems = [
    { label: 'Recruitment and selection apprentice', bold: true },
    { label: 'seleccion.colombia@convertia.com' },
    { label: 'https://convertia.com/es' },
    { label: '311 8252053' },
  ];

  for (const item of footerItems) {
    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(item.label, margin, y);
    y += 5;
  }

  // Return base64 string (without data URI prefix)
  const base64 = doc.output('datauristring');
  return base64.split(',')[1];
}
