import express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import { TwilioClient } from './client/whatsapp-client';
import { AppConfig } from './config/config';
import { TelegramClient } from './client/telegram-client';
import { PaymentService } from './payment/paymentService';
import { PaymentController } from './payment/paymentController';
import { PostgresService } from './store/database';

dotenv.config();

const app: Application = express();

// App level middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Init App config
const config = new AppConfig();
const appConfig = config.serveConfig();

// Init database
const dbClient = new PostgresService(appConfig);
dbClient.connect();

// Init Twilio client
const twilioClient = new TwilioClient(appConfig);

// Init Telegram client
const telegramClient = new TelegramClient(appConfig, dbClient);

if (process.env.NODE_ENV === 'production') {
    telegramClient.initWebhook(app, '/client', appConfig.server.appUrl);
    console.log('✅ Telegram client is running in production mode...');
} else {
    telegramClient.initBot();
    console.log('✅ Telegram client is running in development mode...');
}

// DI for payment routes
const paymentService = new PaymentService(appConfig);
const paymentController = new PaymentController(paymentService);

// Register payment routes
const paymentRouter = paymentController.registerRoutes(express.Router());
app.use('/payment', paymentRouter);

// Webhook to handle incoming messages from WhatsApp
app.post('/client', (req: Request, res: Response) => {
   try {
        const body = req.body.Body.trim().toLowerCase();
        const from = req.body.From;

        if (!body || !from) {
            throw new Error('Missing required parameters: <body> or <from>');
        }

        const onboardText = `
            👋 Welcome to *Kab Connect*!

            📶 Get 24-hour Internet access for just *₦500*.

            Reply *Buy* to get started.
            Reply *Help* for support.

            Stay connected. — Kab Connect
        `;

        const helpText = `Help channel coming soon....`;
        const buyText = `Thank you for your interest! Click the link below to complete your purchase: https://xxxxxxxxxxx`;

        if (body === 'buy') {
            twilioClient.sendMessage(from, buyText, appConfig);
        } else if (body === 'help') {
            twilioClient.sendMessage(from, helpText, appConfig);
        } else {
            twilioClient.sendMessage(from, onboardText, appConfig);
        }
        res.sendStatus(200);
   } catch (e: any) {
        res.status(400).json({
            message: "An error occurred while processing your request.",
            error: e.message
        });
   }
});

// Start server
const server = app.listen(appConfig.server.port, () => { 
    console.log(`✅ Server is running on port ${appConfig.server.port}...`);
});

// ---- Graceful Shutdown ----
const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    try {
        // Stop Telegram bot
        telegramClient.stopBot(signal);

        // Close DB connection
        await dbClient.disconnect();

        // Close Express server
        server.close(() => {
            console.log('✅ HTTP server closed.');
            process.exit(0);
        });
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
