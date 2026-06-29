import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export type PasswordResetToken = {
  rawToken: string;
  tokenHash: string;
};

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(): PasswordResetToken {
  const rawToken = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
  return {
    rawToken,
    tokenHash: hashPasswordResetToken(rawToken),
  };
}

export function passwordResetExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function isPasswordResetTokenExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt <= now;
}
