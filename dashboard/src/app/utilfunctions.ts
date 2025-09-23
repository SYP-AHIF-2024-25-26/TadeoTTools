export function isValid(input: string | null, maxLength: number): boolean {
  return input != null && input.length > 0 && input.length <= maxLength;
}

import { Student } from './types';

export function sortStudents(students: Student[]): Student[] {
  return students.sort((a, b) => {
    if (a.studentClass < b.studentClass) return -1;
    if (a.studentClass > b.studentClass) return 1;

    return a.lastName.localeCompare(b.lastName);
  });
}
