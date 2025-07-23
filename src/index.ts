import express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
// import twilio from 'twilio'; 
import { TwilioClient } from './twilio-client';
import { AppConfig } from './config';
dotenv.config();

// const conf = {
//     port: process.env.PORT || 3221,
//     twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
//     twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',   
//     twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
// };

// const twilioClient = twilio(conf.twilioAccountSid, conf.twilioAuthToken);

const app: Application = express();

// App level middlewares.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Init App config.
const config = new AppConfig();

// Init twilio client with app config.
const twilioClient = new TwilioClient(config.serveConfig());

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
            twilioClient.sendMessage(from, buyText, config.serveConfig());
        } else if (body.toLowerCase() === 'help') {
            twilioClient.sendMessage(from, helpText, config.serveConfig());
        } else {
            twilioClient.sendMessage(from, onboardText, config.serveConfig());
        };
   } catch (e: any) {
    res.status(400).json({
        message: "An error occurred while processing your request.",
        error: e.message
    });
   };
});

app.listen(config.port, () => { console.log(`Server is running on port ${config.port}`) });