import {StudentWithUI} from "./pages/list-students/list-students.component";

export function isValid(input: string | null, maxLength: number): boolean {
  return input != null && input.length > 0 && input.length <= maxLength;
}

import { Student } from './types';

export function sortStudents(students: StudentWithUI[] | Student[]): StudentWithUI[] | Student[] {
  return students.sort((a, b) => {
    if (a.studentClass < b.studentClass) return -1;
    if (a.studentClass > b.studentClass) return 1;

    return a.lastName.localeCompare(b.lastName);
  });
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
