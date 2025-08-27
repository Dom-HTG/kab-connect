import pino from 'pino';

export interface SessionPayload {
  sessionId: string;
  voucherCode: string;
  mac: string;
  ip?: string;
  active: boolean;
}
export class SessionManager {
  private sessions: Map<string, any>;
  private logs: pino.Logger;

  constructor(logger: pino.Logger) {
    this.sessions = new Map();
    this.logs = logger;
  }

  /** Create a new session */
  public createSession(userId: string, data: any) {
    if (this.sessions.has(userId)) {
      throw new Error(`Session for user ${userId} already exists.`);
    }
    this.sessions.set(userId, data);
    this.logs.info(`Session created for user ${userId}`);
  }

  /** Get session data */
  public getSession(userId: string): any {
    return this.sessions.get(userId);
  }

  /** Update session data */
  public updateSession(userId: string, data: any) {
    if (!this.sessions.has(userId)) {
      this.logs.error(`No session found for user ${userId}`);
    }
    this.sessions.set(userId, { ...this.sessions.get(userId), ...data });
    this.logs.info(`Session updated for user ${userId}`);
  }

  /** Delete a session */
  public deleteSession(userId: string) {
    if (!this.sessions.has(userId)) {
      throw new Error(`No session found for user ${userId}`);
    }
    this.sessions.delete(userId);
    this.logs.info(`Session deleted for user ${userId}`);
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
    this.logs.info(`Session expired for user ${userId}`);
  }
}
