import dotenv from 'dotenv';
import { AppConfig } from './config/config';
import { ExpressServer } from './server';
import { CaptivePortalService } from './services/captive-portal/captivePortal';
import { TelegramClient } from './services/bot/telegramClient';
import { PaymentService } from './services/payment/paymentService';
import { PaymentController } from './services/payment/paymentController';
import { PostgresService } from './internal/store/database';
import { expressApp } from './server';

(async () => {
  dotenv.config();

  // Init App config
  const config = new AppConfig();
  const appConfig = config.serveConfig();

  // Init database
  const dbClient = new PostgresService(appConfig);
  await dbClient.connect();

  // Init Telegram client
  const telegramClient = new TelegramClient(appConfig, dbClient);

  if (process.env.NODE_ENV === 'production') {
    telegramClient.initBotProd(expressApp, '/client', appConfig.server.appUrl);
    console.log('✅ Telegram client is running in production mode...');
  } else {
    telegramClient.initBotDev();
    console.log('✅ Telegram client is running in development mode...');
  }

  // Captive portal and payment DI
  const captivePortal = new CaptivePortalService();
  const paymentService = new PaymentService(appConfig);
  const paymentController = new PaymentController(paymentService);

  // Initialize express server.
  new ExpressServer(
    captivePortal,
    appConfig,
    telegramClient,
    dbClient,
    paymentController,
  );
})();
