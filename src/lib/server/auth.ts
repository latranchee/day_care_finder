import bcrypt from 'bcrypt';
import {
	createSession,
	deleteSession,
	getSessionById,
	getUserByEmail,
	createUser,
	createPasswordResetToken,
	getPasswordResetToken,
	markPasswordResetTokenUsed,
	updateUserPassword,
	type User
} from './db';
export type { User };

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function generateSessionId(): string {
	return crypto.randomUUID();
}

export function getSessionExpiry(): Date {
	const expiry = new Date();
	expiry.setDate(expiry.getDate() + SESSION_DURATION_DAYS);
	return expiry;
}

export interface AuthResult {
	success: boolean;
	user?: User;
	sessionId?: string;
	error?: string;
}

export async function signup(
	email: string,
	password: string,
	name: string,
	homeAddress: string,
	maxCommuteMinutes: number
): Promise<AuthResult> {
	// Check if user already exists
	const existingUser = getUserByEmail(email);
	if (existingUser) {
		return { success: false, error: 'Email already registered' };
	}

	// Validate password
	if (password.length < 6) {
		return { success: false, error: 'Password must be at least 6 characters' };
	}

	// Create user
	const passwordHash = await hashPassword(password);
	const user = createUser(email, passwordHash, name, homeAddress, maxCommuteMinutes);

	// Create session
	const sessionId = generateSessionId();
	createSession(user.id, sessionId, getSessionExpiry());

	return { success: true, user, sessionId };
}

export async function login(email: string, password: string): Promise<AuthResult> {
	const user = getUserByEmail(email);
	if (!user) {
		return { success: false, error: 'Invalid email or password' };
	}

	const validPassword = await verifyPassword(password, user.password_hash);
	if (!validPassword) {
		return { success: false, error: 'Invalid email or password' };
	}

	// Create session
	const sessionId = generateSessionId();
	createSession(user.id, sessionId, getSessionExpiry());

	return { success: true, user, sessionId };
}

export function logout(sessionId: string): void {
	deleteSession(sessionId);
}

export function getSession(sessionId: string): (User & { sessionId: string }) | null {
	const session = getSessionById(sessionId);
	if (!session) return null;

	return { ...session.user, sessionId: session.id };
}

// Cookie helpers
export const SESSION_COOKIE_NAME = 'session_id';

export function createSessionCookie(sessionId: string, secure = true): string {
	const expiry = getSessionExpiry();
	const secureFlag = secure ? ' Secure;' : '';
	return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax;${secureFlag} Expires=${expiry.toUTCString()}`;
}

export function createLogoutCookie(secure = true): string {
	const secureFlag = secure ? ' Secure;' : '';
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax;${secureFlag} Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// Password reset helpers
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export function generatePasswordResetToken(): string {
	return crypto.randomUUID();
}

export function getPasswordResetExpiry(): Date {
	const expiry = new Date();
	expiry.setHours(expiry.getHours() + PASSWORD_RESET_EXPIRY_HOURS);
	return expiry;
}

export interface PasswordResetResult {
	success: boolean;
	error?: string;
	resetUrl?: string;
}

/**
 * Initiates a password reset by creating a token.
 * Returns the reset URL for logging/email purposes.
 */
export function initiatePasswordReset(email: string, baseUrl: string): PasswordResetResult {
	const user = getUserByEmail(email);

	// Always return success to prevent email enumeration
	// Even if user doesn't exist, we don't reveal that
	if (!user) {
		return { success: true };
	}

	const token = generatePasswordResetToken();
	const expiresAt = getPasswordResetExpiry();

	createPasswordResetToken(user.id, token, expiresAt);

	const resetUrl = `${baseUrl}/reset-password?token=${token}`;

	// Log the reset URL (in production, this would be sent via email)
	console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);

	return { success: true, resetUrl };
}

export interface ResetPasswordResult {
	success: boolean;
	error?: string;
}

/**
 * Completes a password reset using a valid token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
	// Validate password
	if (newPassword.length < 6) {
		return { success: false, error: 'Password must be at least 6 characters' };
	}

	const resetToken = getPasswordResetToken(token);

	if (!resetToken) {
		return { success: false, error: 'Invalid or expired reset token' };
	}

	// Check if token is expired
	if (new Date(resetToken.expires_at) < new Date()) {
		return { success: false, error: 'Reset token has expired' };
	}

	// Check if token was already used
	if (resetToken.used) {
		return { success: false, error: 'Reset token has already been used' };
	}

	// Update password
	const passwordHash = await hashPassword(newPassword);
	updateUserPassword(resetToken.user_id, passwordHash);

	// Mark token as used
	markPasswordResetTokenUsed(resetToken.id);

	return { success: true };
}

/**
 * Validates a password reset token without using it.
 * Returns the user email if valid.
 */
export function validatePasswordResetToken(token: string): { valid: boolean; email?: string; error?: string } {
	const resetToken = getPasswordResetToken(token);

	if (!resetToken) {
		return { valid: false, error: 'Invalid reset token' };
	}

	if (new Date(resetToken.expires_at) < new Date()) {
		return { valid: false, error: 'Reset token has expired' };
	}

	if (resetToken.used) {
		return { valid: false, error: 'Reset token has already been used' };
	}

	return { valid: true, email: resetToken.user.email };
}
