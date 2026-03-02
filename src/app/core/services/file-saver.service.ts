import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class FileSaverService {

  saveAnyFile(resp: any, fileName?: string): boolean {
    const contentDisposition = resp.headers?.get('content-disposition') || '';
    const name = fileName
      ? fileName
      : contentDisposition.replace(/"/g, '').split(';')[1]?.split('filename=')[1]?.trim() || 'download';
    if (name && resp.body) {
      try {
        const blob = new Blob([resp.body]);
        saveAs(blob, name);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  saveExcel(name: string, blobData: any): boolean {
    if (name && blobData) {
      try {
        const blob = new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, name + '.xlsx');
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
