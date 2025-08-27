import dotenv from 'dotenv';
import { AppConfig } from './config/config';
import { ExpressServer } from './server';
import { CaptivePortalService } from './services/captive-portal/captivePortal';
import { TelegramClient } from './services/bot/telegramClient';
import { PaymentRepository } from './services/payment/paymentRepository';
import { PaymentService } from './services/payment/paymentService';
import { PaymentController } from './services/payment/paymentController';
import { PostgresService } from './internal/store/database';
import { expressApp } from './server';
import { PinoLogger } from './internal/logger/pino.logger';

(async () => {
  dotenv.config();

  // Init App config
  const config = new AppConfig();
  const appConfig = config.serveConfig();

  // Init database
  const dbClient = new PostgresService(appConfig);
  await dbClient.connect();

  // initialize logger.
  const logger = new PinoLogger().getLogger();

  // Init Telegram client
  const telegramClient = new TelegramClient(appConfig, dbClient, logger);

  if (process.env.NODE_ENV === 'production') {
    telegramClient.initBotProd(expressApp, '/client', appConfig.server.appUrl);
    logger.info('✅ Telegram client is initialized in production mode.');
  } else {
    telegramClient.initBotDev();
    logger.info('✅ Telegram client is running in development mode.');
  }

  // Captive portal and payment DI
  const captivePortal = new CaptivePortalService(logger);

  /* Payment DI */
  const dataSource = dbClient.getDataSource();
  const paymentRepository = new PaymentRepository(dbClient, dataSource, logger);
  const paymentService = new PaymentService(
    appConfig,
    paymentRepository,
    logger,
  );
  const paymentController = new PaymentController(paymentService, logger);

  // Initialize express server.
  // This will also register all routes and error handler.
  new ExpressServer(
    captivePortal,
    appConfig,
    telegramClient,
    dbClient,
    paymentController,
    logger,
  );
})();
