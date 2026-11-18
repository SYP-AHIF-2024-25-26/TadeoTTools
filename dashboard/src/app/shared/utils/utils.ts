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

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

// Asks with a "Save as" dialog where the file goes, then writes it there, so
// no PDF reader or browser extension opens it (e.g. HP Sure Click blocks
// saving and printing in Acrobat). The dialog needs the click's user
// activation, so it opens before the (slow) content is produced. Browsers
// without the File System Access API (Firefox, Safari) fall back to a normal
// download. Returns false if the user cancelled the dialog.
export async function saveFileAs(
  filename: string,
  type: { description: string; mime: string; extension: string },
  produce: () => Promise<Blob>
): Promise<boolean> {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker })
    .showSaveFilePicker;
  if (!picker) {
    downloadFile(await produce(), filename);
    return true;
  }

  let handle: FileSystemFileHandle;
  try {
    handle = await picker.call(window, {
      suggestedName: filename,
      types: [
        {
          description: type.description,
          accept: { [type.mime]: [type.extension] },
        },
      ],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }
    throw error;
  }

  const blob = await produce();
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

// The last download's URL stays valid until the next download: iOS Safari
// shows the file in a preview that keeps reading the blob URL, and sharing it
// from there fails with "WebKitBlobResource error 1" once it is revoked.
let lastDownloadUrl: string | null = null;

export function downloadFile(blob: Blob, filename: string) {
  if (lastDownloadUrl) {
    window.URL.revokeObjectURL(lastDownloadUrl);
  }
  const url = window.URL.createObjectURL(blob);
  lastDownloadUrl = url;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
