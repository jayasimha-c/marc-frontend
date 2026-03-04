export enum AbapImportLogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ABORT = 'ABORT',
}

export interface AbapImportLog {
  level: AbapImportLogLevel;
  object: string;
  objectId: string;
  message: string;
  rowNumber?: number;
  sheetName?: string;
  fieldName?: string;
  index?: number;
}

export enum AbapImportMode {
  APPEND = 'append',
  REPLACE = 'replace',
}

export interface AbapImportDialogData {
  file: File;
  mode: AbapImportMode;
}
