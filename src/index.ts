import express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
// import twilio from 'twilio'; 
import { TwilioClient } from './client/whatsapp-client';
import { AppConfig } from './config/config';
import { TelegramClient } from './client/telegram-client';
import { PaymentService } from './payment/paymentService';
import { PaymentController } from './payment/paymentController';
// import { Context, Telegraf } from 'telegraf';
// import { MongoService } from './store/database';
// import { PostgresService } from './store/database';
dotenv.config();

const app: Application = express();

// App level middlewares.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Init App config.
const config = new AppConfig();
const appConfig = config.serveConfig(); // configuration object to be passed around the entire application.

// Init database with app config.
// const dbClient = new PostgresService(appConfig);
// dbClient.connect();

// Init twilio client with app config.
const twilioClient = new TwilioClient(appConfig);

// Init telegram client with app config.
const telegramClient = new TelegramClient(appConfig);

if (process.env.NODE_ENV === 'production') {
    telegramClient.initWebhook(app, '/client', appConfig.server.appUrl); //start the telegram client with webhook.
    console.log('✅ Telegram client is running in production mode...');
}else {
    telegramClient.initBot(); // start the telegram client in development mode.
    console.log('✅ Telegram client is running in development mode...');
};

// DI for payment routes.
const paymentService = new PaymentService(appConfig);
const paymentController = new PaymentController(paymentService);

// Register payment routes.
const paymentRouter = paymentController.registerRoutes(express.Router());
app.use('/payment', paymentRouter);

// Webhook to handle incoming messages from whatsapp.
app.post('/client', (req: Request, res: Response) => {
   try {
        const body = req.body.Body.trim().toLowerCase();
        const from = req.body.From;

        if (!body  || !from) {
            throw new Error('Missing required parameters: <body> or <from>');
        };

        const onboardText = `
            👋 Welcome to *Kab Connect*!

            📶 Get 24-hour Internet access for just *₦500*.

            Reply *Buy* to get started.
            Reply *Help* for support.

            Stay connected. — Kab Connect
        `;

        const helpText = `Help channel coming soon....`;

        const buyText = `Thank you for your interest! Click the link below to complete your purchase: https://xxxxxxxxxxx`;

        if (body.toLowerCase() === 'buy') {
            twilioClient.sendMessage(from, buyText, appConfig);
        } else if (body.toLowerCase() === 'help') {
            twilioClient.sendMessage(from, helpText, appConfig);
        } else {
            twilioClient.sendMessage(from, onboardText, appConfig);
        };
   } catch (e: any) {
    res.status(400).json({
        message: "An error occurred while processing your request.",
        error: e.message
    });
   };
});

app.listen(appConfig.server.port, () => { console.log(`✅ Server is running on port ${config.port}...`) });