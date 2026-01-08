import bcrypt from 'bcrypt';
import { createSession, deleteSession, getSessionById, getUserByEmail, createUser, type User } from './db';

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

export function createSessionCookie(sessionId: string): string {
	const expiry = getSessionExpiry();
	return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiry.toUTCString()}`;
}

export function createLogoutCookie(): string {
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
