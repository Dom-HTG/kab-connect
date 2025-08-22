/*
    Minimal captive portal for kab-connect

  - Serves a login page for voucher entry
  - Validates voucher and enforces a 200 active-session limit
  - Tracks sessions and auto-expires after 24h from purchase
  - Designed to work behind a Starlink Wi‑Fi/Third party router (e.g, microTik) that performs the redirect
*/
import express, { Application } from 'express';
import { VoucherManager } from './voucher';
import { SessionManager } from './session';
import { UserDTO } from '../../types/user';
import { v4 as uniqueID } from 'uuid';
import { ApiError } from '../../internal/error';
import { ApiResponseDTO, SuccessResponse } from '../../internal/responses';

export class CaptivePortalService {
  private voucherManager: VoucherManager;
  private sessionManager: SessionManager;
  private MAX_CONNECTIONS = 200;

  constructor() {
    this.voucherManager = new VoucherManager();
    this.sessionManager = new SessionManager();

    console.log(
      '✅ Captive Portal Service is ready ...',
    );
  }

  private requireUserInfo(userRequestObject: express.Request): Partial<UserDTO> {
    const userInfo: Partial<UserDTO> = {
      id: uniqueID(),
      userIp: userRequestObject.query.ip as string,
      userMac: userRequestObject.headers['x-forwarded-for'] as string,
      email: userRequestObject.body.email as string,
      telegramId: parseInt(userRequestObject.body.telegramId),
    };
    return userInfo;
  }

  public registerRoutes(router: express.Router) {
    /* 
      Login to kab-connect internet service.
      This will register the users' session as active.
    */
    router.post('/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        /* Extract user info from request */
        const userInfo = this.requireUserInfo(req);
        const { voucherCode } = req.body;

        /* Validate userInfo, voucherCode.. */
        if (!voucherCode || !userInfo.telegramId) { 
          throw new ApiError(400, '❌ Missing required parameters: <voucherCode> or <userId>');
          return;
        };

        /* validate the voucherCode */
        if (this.validateVoucher(voucherCode) === false) {
          throw new ApiError(400, '❌ Invalid or expired voucher.');
          return;
        } else {
          /* start the session */
          if (this.startSession(userInfo.id as string, voucherCode)) {
            const payload: ApiResponseDTO = {
              success: true,
              status_code: 200,
              message: '✅ Access granted! You are connected.',
            }
            SuccessResponse(res, payload);
          } else {
            throw new ApiError(400, '❌ Invalid voucher or max connections reached.');
          }
        };
      } catch (e) {
        next(e);
      };
    });

    /* 
      Logout of kab-connect internet service.
      This will terminate user session allowing other users to login under the 200-person user cap.
    */
     router.post('/logout', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        /* Extract user info from request */
        const userInfo = this.requireUserInfo(req);

        /* Validate userInfo */
        if (!userInfo.id) {
          throw new ApiError(400, '❌ Missing required parameter: <userId>');
        }

        /* End the session */
        this.endSession(userInfo.id as string);

        const payload: ApiResponseDTO = {
          success: true,
          status_code: 200,
          message: '🔌 Session ended.',
        };
        SuccessResponse(res, payload);
      } catch (e) {
        next(e);
      }
    });
  }


  /* Captive Portal Service Methods */
  validateVoucher(voucherCode: string): boolean {
    return this.voucherManager.validateVoucher(voucherCode);
  }

  startSession(userId: string, voucherCode: string): boolean {
    if (this.sessionManager.getActiveSessions().length >= this.MAX_CONNECTIONS)
      return false;
    if (!this.voucherManager.validateVoucher(voucherCode)) return false;

    try {
      this.sessionManager.createSession(userId, voucherCode);
      this.voucherManager.markVoucherAsUsed();
      return true;
    } catch {
      return false;
    };
  }

  endSession(sessionId: string): void {
    this.sessionManager.expireSession(sessionId);
  }
}
