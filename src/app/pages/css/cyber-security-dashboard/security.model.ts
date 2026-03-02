export interface SecurityEvent {
  id: string;
  code: string;
  time: string;
  system: string;
  sapSystemName: string;
  createdDate: string;
  category: string;
  tag: string;
  event: string;
  user: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  anomalyScore: number;
  status: string;
  timestamp: number;
}

export interface SystemSeverityCounts {
  system: string;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  total: number;
}

export interface SeverityEntry {
  severity: string;
  total_count: number;
}

export interface TimelineData {
  hour: string;
  total: number;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

export interface StatusData {
  name: string;
  value: number;
  fill: string;
}

export interface CategoryData {
  name: string;
  size: number;
  children: {
    name: string;
    size: number;
    events: SecurityEvent[];
  }[];
}

export interface SecurityStats {
  total: number;
  systems: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  inProgress: number;
  resolved: number;
  falsePositive: number;
}

export interface SystemRow {
  name: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  criticalPct: number;
  highPct: number;
  mediumPct: number;
  lowPct: number;
}

export interface TriageEntry {
  key: string;
  label: string;
  count: number;
  color: string;
}
