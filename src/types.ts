export type VaultItemType = 'password' | 'crypto' | 'photo' | 'file' | 'note' | 'card';

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  createdAt: number;
  updatedAt: number;
  encryptedData: string; // Données chiffrées en base64
  iv: string; // IV utilisé pour le chiffrement
  salt: string; // Salt utilisé pour la dérivation de clé
  tag: string; // Auth tag pour AES-GCM
}

export interface PasswordEntry {
  website: string;
  username: string;
  password: string;
  notes?: string;
}

export interface CryptoEntry {
  walletName: string;
  address: string;
  privateKey: string;
  seedPhrase?: string;
  network?: string;
  notes?: string;
}

export interface NoteEntry {
  content: string;
}

export interface CardEntry {
  cardHolder: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  bank?: string;
  notes?: string;
}

export interface FileEntry {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
  notes?: string;
}

export interface PhotoEntry {
  photoName: string;
  photoData: string; // base64
  notes?: string;
}

export type VaultEntry = PasswordEntry | CryptoEntry | NoteEntry | CardEntry | FileEntry | PhotoEntry;
