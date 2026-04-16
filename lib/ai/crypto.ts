import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// AES-256-GCM encryption for BYOK API keys stored in club_ai_settings.
// The master key comes from env (AI_ENCRYPTION_KEY). It's hashed to 32 bytes
// so callers can use any string — e.g. a long random hex or passphrase.
//
// Storage layout per key: { ciphertext, iv, tag } — three base64 columns.
// Rotating the master key means decrypting + re-encrypting every row.

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.AI_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("AI_ENCRYPTION_KEY is not set");
  }
  return createHash("sha256").update(raw).digest();
}

export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptSecret(plaintext: string): EncryptedBlob {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(blob: EncryptedBlob): string {
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(blob.iv, "base64"));
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
