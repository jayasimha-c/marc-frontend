export interface OAuth2Client {
  id?: number;
  clientId: string;
  clientSecret?: string;
  clientName: string;
  description?: string;
  grantTypes: string;
  scopes: string;
  accessTokenValidity?: number;
  enabled: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface OAuth2Scope {
  id?: number;
  scopeName: string;
  description?: string;
  resource?: string;
  permission?: string;
  isDefault?: boolean;
}

export interface OAuth2Token {
  id: number;
  tokenValue: string;
  clientId: string;
  scopes?: string;
  issuedAt?: string;
  expiresAt?: string;
  revoked: boolean;
  revokedAt?: string;
  expired: boolean;
  expiresInSeconds?: number;
}

export interface OAuth2AuditLog {
  id: number;
  clientId: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  scopes?: string;
  createdDate: string;
}
