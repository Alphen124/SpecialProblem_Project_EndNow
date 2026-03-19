// ============================================================
// Global type declarations for client-side scripts
// ============================================================

// Window extensions assigned by client scripts
interface Window {
  /** Marks a chat notification as read — set by chat-notifications.ts */
  _cnClick: (notifId: number) => void;
  /** Uploads device images — set by image-upload.ts */
  uploadDeviceImages: (files: FileList) => Promise<string[]>;
  /** NoteLetAuth namespace — set by auth.ts */
  NoteLetAuth: NoteLetAuthNamespace;
}

// ── Auth types ──────────────────────────────────────────────

interface User {
  user_id?: number;
  email: string;
  fname?: string;
  lname?: string;
  tel?: string;
  is_admin?: boolean;
  profile_image?: string;
}

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

interface NoteLetAuthNamespace {
  isAuthenticated: () => boolean;
  requireAuth: () => boolean;
  redirectIfAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user: User }>;
  register: (
    email: string,
    password: string,
    fname: string,
    lname: string,
    tel?: string
  ) => Promise<{ success: boolean; data: unknown; message?: string }>;
  logout: () => void;
  getProfile: () => Promise<User>;
  getUser: () => User | null;
  getToken: () => string | null;
  api: <T = unknown>(endpoint: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
}

// ── Cart / Nav types ─────────────────────────────────────────

interface CartItem {
  name?: string;
  price?: string | number;
  total?: number;
  date?: string;
  pickup?: string;
  returnt?: string;
  source?: string;
  status?: string;
  location?: string;
  lessor?: string;
  completedAt?: string;
  detail?: string;
}

interface FavItem {
  name?: string;
  detail?: string;
}

// ── Chat notification types ──────────────────────────────────

interface ChatNotification {
  notifId: number;
  isRead: boolean;
  senderName: string;
  deviceId?: number | string;
  deviceName?: string;
  roomName?: string;
  preview?: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: ChatNotification[];
  unread: number;
}

// ── Cross-script globals ─────────────────────────────────────

/** Defined by auth.ts at global scope */
declare function logout(): void;
/** Defined by auth.ts at global scope */
declare function toggleUserMenu(e?: MouseEvent): void;
/** Defined on some device management pages */
declare function loadMyDevices(): Promise<void>;
