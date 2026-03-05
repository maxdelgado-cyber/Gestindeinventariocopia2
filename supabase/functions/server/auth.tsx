import * as kv from "./kv_store.tsx";

const ADMIN_KEY = "allegra_admin";
const AUDIT_PREFIX = "allegra_audit_";
const LOGIN_ATTEMPTS_PREFIX = "allegra_login_attempts_";

export interface AdminProfile {
  username: string;
  password: string; // hashed
  email?: string;
  company: string;
  createdAt: string;
  lastPasswordChange?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  userId: string;
}

export interface LoginAttempt {
  timestamp: string;
  success: boolean;
  ip?: string;
}

// Hash password using Web Crypto API (compatible with Deno)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize admin profile if not exists
export async function initializeAdmin(): Promise<void> {
  try {
    const existingAdmin = await kv.get(ADMIN_KEY);
    if (!existingAdmin) {
      const defaultAdmin: AdminProfile = {
        username: "admin",
        password: await hashPassword("allegra2026"), // Default password
        email: "admin@allegra.com",
        company: "Allegra Productora de Audio",
        createdAt: new Date().toISOString(),
      };
      await kv.set(ADMIN_KEY, defaultAdmin);
      console.log("Admin initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
    throw error;
  }
}

// Verify credentials
export async function verifyCredentials(password: string): Promise<boolean> {
  try {
    const admin = await kv.get(ADMIN_KEY);
    if (!admin) {
      await initializeAdmin();
      const defaultHash = await hashPassword("allegra2026");
      const passwordHash = await hashPassword(password);
      return passwordHash === defaultHash;
    }
    const passwordHash = await hashPassword(password);
    return admin.password === passwordHash;
  } catch (error) {
    console.error("Error verifying credentials:", error);
    throw error;
  }
}

// Get admin profile
export async function getAdminProfile(): Promise<AdminProfile | null> {
  try {
    return await kv.get(ADMIN_KEY);
  } catch (error) {
    console.error("Error getting admin profile:", error);
    throw error;
  }
}

// Update admin profile
export async function updateAdminProfile(updates: Partial<AdminProfile>): Promise<void> {
  try {
    const admin = await kv.get(ADMIN_KEY);
    if (!admin) throw new Error("Admin not found");
    
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
      updates.lastPasswordChange = new Date().toISOString();
    }
    
    await kv.set(ADMIN_KEY, { ...admin, ...updates });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    throw error;
  }
}

// Log audit action
export async function logAudit(action: string, module: string, details: string): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: Date.now().toString(),
      action,
      module,
      details,
      timestamp: new Date().toISOString(),
      userId: "admin",
    };
    
    const key = `${AUDIT_PREFIX}${auditLog.id}`;
    await kv.set(key, auditLog);
  } catch (error) {
    console.error("Error logging audit:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

// Get audit logs
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const logs = await kv.getByPrefix(AUDIT_PREFIX);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return [];
  }
}

// Log login attempt
export async function logLoginAttempt(success: boolean, ip?: string): Promise<void> {
  try {
    const attempt: LoginAttempt = {
      timestamp: new Date().toISOString(),
      success,
      ip,
    };
    
    const key = `${LOGIN_ATTEMPTS_PREFIX}${Date.now()}`;
    await kv.set(key, attempt);
  } catch (error) {
    console.error("Error logging login attempt:", error);
    // Don't throw - logging should not break the main flow
  }
}

// Get login attempts
export async function getLoginAttempts(): Promise<LoginAttempt[]> {
  try {
    const attempts = await kv.getByPrefix(LOGIN_ATTEMPTS_PREFIX);
    return attempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error getting login attempts:", error);
    return [];
  }
}