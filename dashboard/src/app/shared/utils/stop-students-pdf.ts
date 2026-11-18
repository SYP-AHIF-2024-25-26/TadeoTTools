import { Status, Stop, StopManager, Student } from '@/shared/models/types';
import { sortStudents } from '@/shared/utils/utils';

// One page per stop with its stop managers and approved students (pending
// requests are not listed), for printing. jsPDF is loaded only when the export
// runs, so it stays out of the initial bundle. Stops without students are left
// out.
export async function stopStudentsPdf(
  stops: Stop[],
  students: Student[],
  stopManagers: StopManager[]
): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stop.name, margin, margin + 5, { maxWidth: width });
    doc.setFont('helvetica', 'normal');
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
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${stop.name} (continued)`, margin, margin + 3);
      },
      theme: 'grid',
      styles: {
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
