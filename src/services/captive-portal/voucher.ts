import { SessionPayload } from './session';

export interface VoucherPayload {
  code: string;
  paid: boolean;
  createdAt: Date;
  expiresAt: Date;
  lockToDevice?: boolean; // Optional: lock voucher to device MAC
  deviceId?: string; // Optional: device MAC address
  isUsed?: boolean; // Optional: true if voucher has been used
}

export class VoucherManager {
  private vouchers: Map<string, VoucherPayload>;
  private sessions: Map<string, SessionPayload>;

  constructor() {
    this.vouchers = new Map();
    this.sessions = new Map();
  }

  /** Create a new voucher */
  public createVoucher(
    code: string,
    amount: number,
    lockToDevice?: boolean,
    deviceId?: string,
  ): VoucherPayload {
    const voucher: VoucherPayload = {
      code,
      paid: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      lockToDevice,
      deviceId,
    };
    this.vouchers.set(code, voucher);
    return voucher;
  }

  /** Validate a voucher */
  public validateVoucher(code: string): boolean {
    const voucher = this.vouchers.get(code);
    if (!voucher || !voucher.paid || new Date() > voucher.expiresAt) {
      return false;
    }
    return true;
  }

  /** Create a session for a voucher */
  public createSession(
    voucherCode: string,
    mac: string,
    ip?: string,
  ): SessionPayload {
    if (!this.validateVoucher(voucherCode)) {
      throw new Error('Invalid or expired voucher.');
    }

    const sessionId = `${voucherCode}-${mac}-${Date.now()}`;
    const session: SessionPayload = {
      sessionId,
      voucherCode,
      mac,
      ip,
      active: true,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /** Get active sessions */
  public getActiveSessions(): SessionPayload[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.active,
    );
  }

  /** End a session */
  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      this.sessions.set(sessionId, session);
    }
  }

  /** Mark Used */
  public markVoucherAsUsed(): void {
    this.vouchers.forEach((voucher) => {
      voucher.isUsed = true;
    });
  }
}
