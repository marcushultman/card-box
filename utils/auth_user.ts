export interface AuthUser {
  id: string;
  jwt: string;
  gjwt?: string; // google jwt, short expiry (1h).
}

export function ensureSignedIn(blob: AuthUser) {
}
