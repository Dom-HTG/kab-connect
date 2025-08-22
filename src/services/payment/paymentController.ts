import express, { Router } from 'express';
import { PaymentService } from './paymentService';
import { TransactionPayload } from '.';
import { ApiError } from '../../internal/error';
import { BadRequestError } from '../../internal/error';

export class PaymentController {
  private readonly paystack: PaymentService;

  constructor(paystackClient: PaymentService) {
    this.paystack = paystackClient;
  }

  public registerRoutes = (router: Router): Router => {
    router.post('/init', this.initialize);
    router.get('/verify/:reference', this.verify);

    return router;
  };

  public initialize = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { email, amount } = req.body;

      if (!email || !amount)
        throw new BadRequestError('Email and amount are required');

      const payload: TransactionPayload = {
        email,
        amount,
      };

      const result = await this.paystack.initializeTransaction(payload);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      next(err);
    }
  };

  public verify = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { reference } = req.params;
      const result = await this.paystack.verifyTransaction(reference);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      next(err);
    }
  };
}
