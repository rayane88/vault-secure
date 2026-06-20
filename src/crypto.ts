import type { VaultEntry } from './types';

const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Génère un salt cryptographiquement sécurisé
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Génère un IV (Initialisation Vector) pour AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Dérive une clé AES-256-GCM à partir d'un mot de passe maître et d'un salt
 * Utilise PBKDF2 avec 100 000 itérations
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffre des données avec AES-256-GCM
 * Retourne un objet avec les données chiffrées, le salt, l'IV et le tag
 */
export async function encryptData(data: VaultEntry, password: string): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
  tag: string;
}> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));
  
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer as ArrayBuffer },
    key,
    plaintext
  );
  
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, -TAG_LENGTH);
  const tag = encryptedArray.slice(-TAG_LENGTH);
  
  return {
    encryptedData: arrayBufferToBase64(ciphertext),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    tag: arrayBufferToBase64(tag),
  };
}

/**
 * Déchiffre des données avec AES-256-GCM
 */
export async function decryptData(
  encryptedData: string,
  salt: string,
  iv: string,
  tag: string,
  password: string
): Promise<VaultEntry> {
  const saltBytes = base64ToUint8Array(salt);
  const key = await deriveKey(password, saltBytes);
  
  const ciphertext = base64ToUint8Array(encryptedData);
  const authTag = base64ToUint8Array(tag);
  const ivBytes = base64ToUint8Array(iv);
  
  // Reconstituer le buffer complet (ciphertext + tag)
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);
  
  const ivBuffer = ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer as ArrayBuffer },
    key,
    combined
  );
  
  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);
  
  return JSON.parse(decryptedText) as VaultEntry;
}

/**
 * Vérifie si un mot de passe est correct en essayant de déchiffrer un élément de test
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const testData = { test: 'vault-check' } as unknown as VaultEntry;
    const encrypted = await encryptData(testData, password);
    await decryptData(
      encrypted.encryptedData,
      encrypted.salt,
      encrypted.iv,
      encrypted.tag,
      password
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Options pour le générateur de mot de passe avancé
 */
export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: '0O1lI',
};

/**
 * Génère un mot de passe fort aléatoire
 */
export function generatePassword(length: number = 16): string {
  return generatePasswordAdvanced({ ...DEFAULT_PASSWORD_OPTIONS, length });
}

/**
 * Génère un mot de passe fort aléatoire avec options avancées
 */
export function generatePasswordAdvanced(options: Partial<PasswordOptions> = {}): string {
  const opts = { ...DEFAULT_PASSWORD_OPTIONS, ...options };
  let charset = '';
  const requiredChars: string[] = [];

  if (opts.uppercase) {
    charset += CHAR_SETS.uppercase;
    requiredChars.push(...pickRandom(CHAR_SETS.uppercase, 1));
  }
  if (opts.lowercase) {
    charset += CHAR_SETS.lowercase;
    requiredChars.push(...pickRandom(CHAR_SETS.lowercase, 1));
  }
  if (opts.numbers) {
    charset += CHAR_SETS.numbers;
    requiredChars.push(...pickRandom(CHAR_SETS.numbers, 1));
  }
  if (opts.symbols) {
    charset += CHAR_SETS.symbols;
    requiredChars.push(...pickRandom(CHAR_SETS.symbols, 1));
  }

  if (opts.excludeAmbiguous) {
    for (const ch of CHAR_SETS.ambiguous) {
      charset = charset.replace(ch, '');
    }
  }

  if (charset.length === 0) return '';

  const remainingLength = Math.max(opts.length - requiredChars.length, 0);
  const passwordArray = [...requiredChars, ...pickRandom(charset, remainingLength)];
  
  // Mélanger Fisher-Yates
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Calcule la force d'un mot de passe (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  
  // Longueur
  score += Math.min(password.length * 4, 40);
  
  // Variété de caractères
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  
  // Bonus longueur
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  
  return Math.min(score, 100);
}

function pickRandom(charset: string, count: number): string[] {
  const array = crypto.getRandomValues(new Uint8Array(count));
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(charset[array[i] % charset.length]);
  }
  return result;
}

/**
 * Hachage SHA-256 d'une chaîne (utilisé pour stocker un hash de vérification)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Utilitaires de conversion
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
