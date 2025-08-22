import express from 'express';
import cors from 'cors';
import { CaptivePortalService } from './services/captive-portal/captivePortal';
import { TelegramClient } from './services/bot/telegramClient';
import { PostgresService } from './internal/store/database';
import { PaymentController } from './services/payment/paymentController';
import { Configs } from './config/config';
import { errorHandler } from './internal/error';

export var expressApp: express.Application = express();

export class ExpressServer {
  private app: express.Application
  private httpServer: any;
  private captivePortal: CaptivePortalService;
  private readonly conf: Configs;
  private telegram: TelegramClient;
  private db: PostgresService;
  private paymentController: PaymentController;

  constructor(
    captivePortal: CaptivePortalService,
    config: Configs,
    telegramClient: TelegramClient,
    dbClient: PostgresService,
    paymentController: PaymentController,
  ) {

    this.app = expressApp;

    this.registerCors();

    // Load configuration
    this.conf = config;
    this.db = dbClient;
    this.paymentController = paymentController;

    this.telegram = telegramClient;

    this.captivePortal = captivePortal;
    this.registerMiddleware();
    this.registerCaptivePortalRoutes(); /* routes for captive portal */
    this.registerPaymentRoutes(); /* routes for payment */

    /* Handle errors globally */
    this.registerErrorHandling();
  
    this.listen();

    // Graceful shutdown.
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
  }

  private registerCors() {
    const corsConfig = {
      origin: '*', 
      methods: ['GET', 'POST'],
      crendentials: true
    };

    this.app.use(cors(corsConfig));
  }

  /* Base Middleware stack */
  private registerMiddleware() {
    this.app.set('trust proxy', true);
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
  }

  private registerErrorHandling() {
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler(err, req, res, next);
    });
  }

  private registerCaptivePortalRoutes() {
    const portalRouter = express.Router();
    this.captivePortal.registerRoutes(portalRouter);
    this.app.use('/portal', portalRouter);
  }

  private registerPaymentRoutes() {
    const paymentRouter = express.Router();
    this.paymentController.registerRoutes(paymentRouter);
    this.app.use('/payment', paymentRouter);
  }

  listen() {
    this.httpServer = this.app.listen(this.conf.server.port, () => {
      console.log(`Captive portal running on port ${this.conf.server.port}`);
    });
  }

  // ---- Graceful Shutdown ----
  async shutdown(signal: string) {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    try {
      // Stop Telegram bot
      this.telegram.stopBot(signal);

      // Close DB connection
      await this.db.disconnect();

      // Close Express server
      this.httpServer.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    };
  }
}
