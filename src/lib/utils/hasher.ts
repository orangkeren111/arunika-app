import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard length for GCM

/**
 * Ensures secret key is set and derives a fixed 32-byte key for AES-256.
 */
const getSecretKey = (): Buffer => {
  const secret = process.env.KEY_ENCRYPTION_SECRET || process.env.KEY_HASHER_SECRET;
  if (!secret) {
    throw new Error("Fatal: Missing KEY_ENCRYPTION_SECRET environment variable.");
  }
  // Hash the environment secret into a guaranteed 32-byte Buffer
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts an API key using AES-256-GCM.
 * Stored string format: "<IV_hex>:<AUTH_TAG_hex>:<ENCRYPTED_DATA_hex>"
 */
export function encryptApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = getSecretKey();

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(trimmed, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key string back to plaintext.
 */
export function decryptApiKey(encryptedPayload: string): string {
  if (!encryptedPayload) return "";

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key payload format.");
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const keyBuffer = getSecretKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyBuffer,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask an API key string for display in UI (e.g. "gsk_gl...9eJt")
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 10) {
    return "*******";
  }
  const start = trimmed.substring(0, 6);
  const end = trimmed.substring(trimmed.length - 4);
  return `${start}...${end}`;
}