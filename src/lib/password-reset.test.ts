import assert from "node:assert/strict";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenExpired,
  passwordResetExpiry,
} from "./password-reset";

const token = createPasswordResetToken();

assert.equal(typeof token.rawToken, "string");
assert.equal(token.rawToken.length, 64);
assert.equal(token.tokenHash, hashPasswordResetToken(token.rawToken));
assert.notEqual(token.tokenHash, token.rawToken);

const now = new Date("2026-06-29T00:00:00.000Z");
const expiresAt = passwordResetExpiry(now);
assert.equal(expiresAt.toISOString(), "2026-06-29T00:30:00.000Z");

assert.equal(isPasswordResetTokenExpired(new Date("2026-06-29T00:29:59.000Z"), now), false);
assert.equal(isPasswordResetTokenExpired(new Date("2026-06-29T00:00:00.000Z"), now), true);
assert.equal(isPasswordResetTokenExpired(new Date("2026-06-28T23:59:59.000Z"), now), true);

console.log("password-reset tests passed");
