import { Status, Stop, StopManager, Student } from '@/shared/models/types';
import { sortStudents } from '@/shared/utils/utils';

// One page per stop with its stop managers and approved students (pending
// requests are not listed), for printing. jsPDF is loaded only when the export
// runs, so it stays out of the initial bundle. Stops without students are left
// out.
//
// jsPDF's built-in Helvetica only covers Latin-1: names like Ćosić, Dvořák or
// Şahin lose letters and come out letter-spaced. So the PDF embeds Noto Sans,
// which the build copies from @expo-google-fonts/noto-sans to assets/fonts.
const FONT = 'NotoSans';
const FONT_FILES = {
  normal: 'NotoSans_400Regular.ttf',
  bold: 'NotoSans_700Bold.ttf',
} as const;

export type FontLoader = (file: string) => Promise<ArrayBuffer>;

// Relative to the document base, so it works under /admin/ too.
const fetchFont: FontLoader = async (file) => {
  const response = await fetch(`assets/fonts/${file}`);
  if (!response.ok) throw new Error(`Font ${file}: HTTP ${response.status}`);
  return response.arrayBuffer();
};

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function stopStudentsPdf(
  stops: Stop[],
  students: Student[],
  stopManagers: StopManager[],
  loadFont: FontLoader = fetchFont
): Promise<Blob> {
  const [{ jsPDF }, { autoTable }, normal, bold] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFont(FONT_FILES.normal),
    loadFont(FONT_FILES.bold),
  ]);

  // The stop list (`GET /api/stops`) has no stop managers; the managers list
  // their stops instead.
  const managersByStop = new Map<number, string[]>();
  for (const m of stopManagers) {
    for (const stopId of m.assignedStops) {
      const list = managersByStop.get(stopId) ?? [];
      list.push(`${m.firstName} ${m.lastName}`);
      managersByStop.set(stopId, list);
    }
  }

  const byStop = new Map<number, Student[]>();
  for (const student of students) {
    for (const a of student.studentAssignments) {
      if (a.status !== Status.Accepted) continue;
      const list = byStop.get(a.stopId) ?? [];
      list.push(student);
      byStop.set(a.stopId, list);
    }
  }

  const stopsWithStudents = stops
    .filter((stop) => byStop.has(stop.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS(FONT_FILES.normal, toBase64(normal));
  doc.addFont(FONT_FILES.normal, FONT, 'normal');
  doc.addFileToVFS(FONT_FILES.bold, toBase64(bold));
  doc.addFont(FONT_FILES.bold, FONT, 'bold');
  doc.setFont(FONT, 'normal');
  const margin = 15;
  const date = new Date().toLocaleDateString('de-AT');

  if (stopsWithStudents.length === 0) {
    doc.setFontSize(12);
    doc.text('No students are assigned to a stop.', margin, margin + 5);
  }

  stopsWithStudents.forEach((stop, index) => {
    if (index > 0) doc.addPage();

    const sorted = sortStudents([...byStop.get(stop.id)!]);
    const managers = managersByStop.get(stop.id) ?? [];
    const width = doc.internal.pageSize.getWidth() - 2 * margin;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(16);
    doc.text(stop.name, margin, margin + 5, { maxWidth: width });
    doc.setFont(FONT, 'normal');
    doc.setFontSize(10);
    const details = [
      stop.roomNr ? `Room ${stop.roomNr}` : null,
      `${sorted.length} ${sorted.length === 1 ? 'student' : 'students'}`,
      date,
    ].filter(Boolean);
    doc.text(details.join('  ·  '), margin, margin + 12);
    const managerLines: string[] = doc.splitTextToSize(
      `Responsible: ${managers.length ? managers.join(', ') : '–'}`,
      width
    );
    doc.text(managerLines, margin, margin + 17);

    autoTable(doc, {
      startY: margin + 17 + managerLines.length * 5,
      // `top` applies to continuation pages, which repeat the stop name.
      margin: { left: margin, right: margin, top: margin + 8 },
      didDrawPage: (data) => {
        if (data.pageNumber === 1) return;
        doc.setFont(FONT, 'bold');
        doc.setFontSize(11);
        doc.text(`${stop.name} (continued)`, margin, margin + 3);
      },
      theme: 'grid',
      styles: {
        font: FONT,
        fontSize: 10,
        textColor: 20,
        lineColor: 60,
        lineWidth: 0.2,
        cellPadding: 2,
      },
      headStyles: { fillColor: 230, textColor: 20, fontStyle: 'bold' },
      head: [['#', 'Last Name', 'First Name', 'Class']],
      body: sorted.map((s, i) => [
        String(i + 1),
        s.lastName,
        s.firstName,
        s.studentClass,
      ]),
      columnStyles: { 0: { cellWidth: 10, halign: 'right' } },
    });
  });

  return doc.output('blob');
}
