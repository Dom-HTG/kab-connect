export interface SessionPayload {
  sessionId: string;
  voucherCode: string;
  mac: string;
  ip?: string;
  active: boolean;
}
export class SessionManager {
  private sessions: Map<string, any>;

  constructor() {
    this.sessions = new Map();
  }

  /** Create a new session */
  public createSession(userId: string, data: any) {
    if (this.sessions.has(userId)) {
      throw new Error(`Session for user ${userId} already exists.`);
    }
    this.sessions.set(userId, data);
    console.log(`Session created for user ${userId}`);
  }

  /** Get session data */
  public getSession(userId: string): any {
    return this.sessions.get(userId);
  }

  /** Update session data */
  public updateSession(userId: string, data: any) {
    if (!this.sessions.has(userId)) {
      throw new Error(`No session found for user ${userId}`);
    }
    this.sessions.set(userId, { ...this.sessions.get(userId), ...data });
    console.log(`Session updated for user ${userId}`);
  }

  /** Delete a session */
  public deleteSession(userId: string) {
    if (!this.sessions.has(userId)) {
      throw new Error(`No session found for user ${userId}`);
    }
    this.sessions.delete(userId);
    console.log(`Session deleted for user ${userId}`);
  }

  /** Get all active sessions */
  public getActiveSessions(): SessionPayload[] {
    return Array.from(this.sessions.values()).filter(
      (session: SessionPayload) => session.active,
    );
  }

  /** Expire a session (mark as inactive) */
  public expireSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error(`No session found for user ${userId}`);
    }
    session.active = false;
    this.sessions.set(userId, session);
    console.log(`Session expired for user ${userId}`);
  }
}
