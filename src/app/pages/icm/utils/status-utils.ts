export const NONE = 0;
export const SUCCESS = 1;
export const FAILED = 2;

export function getStatusMessage(status: number): string {
  switch (status) {
    case NONE: return 'None';
    case SUCCESS: return 'Success';
    case FAILED: return 'Failed';
    default: return 'Unknown';
  }
}

export function formatResultStatus(status: number): string {
  switch (status) {
    case 0: return 'RUN';
    case 1: return 'SIMULATION';
    default: return 'UNDEFINED';
  }
}

export function formatManualControlTaskStepStatus(status: number): string {
  switch (status) {
    case 0: return 'NONE';
    case 1: return 'SUCCESS';
    case 2: return 'FAILED';
    default: return 'UNDEFINED';
  }
}

export function formatManualResultStatus(status: number): string {
  switch (status) {
    case 1: return 'CREATED';
    case 2: return 'OPENED';
    case 3: return 'CLOSED';
    case 4: return 'FAILED';
    case 5: return 'OVERDUE';
    case 6: return 'DRAFT';
    default: return 'UNDEFINED';
  }
}

export function formatControlJournalStatus(status: number): string {
  switch (status) {
    case 0: return 'NONE';
    case 1: return 'SUCCESS';
    case 2: return 'FAILED';
    default: return 'UNDEFINED';
  }
}

export function formatTaskStatus(status: number): string {
  switch (status) {
    case 1: return 'CREATED';
    case 2: return 'OPENED';
    case 3: return 'CLOSED';
    case 4: return 'FAILED';
    case 5: return 'OVERDUE';
    case 6: return 'DRAFT';
    default: return 'UNDEFINED';
  }
}
