import { Student } from '@/shared/models/types';

export function isValidString(
  input: string | null,
  maxLength: number
): boolean {
  return input != null && input.length > 0 && input.length <= maxLength;
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function sortStudents<T extends Student>(students: T[]): T[] {
  return students.sort((a, b) => {
    if (a.studentClass < b.studentClass) return -1;
    if (a.studentClass > b.studentClass) return 1;

    return a.lastName.localeCompare(b.lastName);
  });
}

// Same format as the backend exports: ";" separated, UTF-8 with BOM, so Excel
// opens it correctly.
export function csvBlob(rows: string[][]): Blob {
  const escape = (field: string) => {
    const safeField = /^[=+\-@\t\r]/.test(field) ? `'${field}` : field;
    return /[;"\r\n]/.test(safeField)
      ? `"${safeField.replace(/"/g, '""')}"`
      : safeField;
  };
  const content = rows.map((row) => row.map(escape).join(';')).join('\r\n');
  return new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
}

// "Robotics Lab (Übung)" -> "robotics-lab-ubung"
export function fileSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
