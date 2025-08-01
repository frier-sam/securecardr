/**
 * Enhanced Core data types for SecureCardr application
 * Now supports multiple images per card
 */

export interface CardImage {
  id: string;
  url: string; // Data URL or Drive URL
  name: string;
  size: number;
  type: string;
  addedAt: Date;
  driveFileId?: string;
}

export interface Card {
  id: string;
  category: 'credit' | 'debit' | 'loyalty' | 'id' | 'other';
  nickname: string;
  number?: string;
  expiryDate?: string;
  issueDate?: string;
  cvv?: string;
  cardholderName?: string;
  notes?: string;
  images: CardImage[]; // Multiple images support
  imageUrl?: string; // Deprecated - kept for backward compatibility
  last4?: string;
  addedAt: Date;
  updatedAt: Date;
  driveFileId?: string; // Google Drive file ID for persistence
}

export interface EncryptedData {
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  ciphertext: string; // Base64 encoded encrypted data
  authTag: string; // Base64 encoded authentication tag
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  driveConnected: boolean;
  folderCreated: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoLock: boolean;
  autoLockTime: number; // minutes
  encryptMetadata: boolean;
  showTutorial: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  parents: string[];
}

export interface CardFormData {
  category: Card['category'];
  nickname: string;
  number: string;
  expiryDate: string;
  issueDate: string;
  cvv: string;
  cardholderName: string;
  notes: string;
  images?: File[]; // Multiple images support
  image?: File; // Deprecated - kept for backward compatibility
}

// Image management utilities
export interface ImageUploadResult {
  success: boolean;
  image?: CardImage;
  error?: string;
}

export interface ImageGalleryProps {
  images: CardImage[];
  onImageAdd: (files: File[]) => void;
  onImageRemove: (imageId: string) => void;
  onImageView: (image: CardImage) => void;
  maxImages?: number;
  allowMultiple?: boolean;
  readOnly?: boolean;
}

// Alias for backward compatibility
export type CardData = Card;

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface EncryptionState {
  isUnlocked: boolean;
  passphraseSet: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  encryption: EncryptionState;
  cards: Card[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface GoogleDriveApiResponse<T = any> {
  data: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  onView: (card: Card) => void;
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = void> = () => T;
export type EventHandlerWithParam<P, T = void> = (param: P) => T;
export type AsyncEventHandler<T = void> = () => Promise<T>;
export type AsyncEventHandlerWithParam<P, T = void> = (param: P) => Promise<T>;
