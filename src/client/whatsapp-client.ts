import { Configs } from "../config/config";

// interface Config {
//     port: string;
//     twilioAccountSid: string;
//     twilioAuthToken: string;
//     twilioPhoneNumber: string;
// }

// const conf: Config = {
//     port: process.env.PORT || "3221",
//     twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
//     twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',   
//     twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
// };

export class TwilioClient {
  private accountSid: string;
  private authToken: string;
  private client: any;

  constructor(conf: Configs) {
    this.accountSid = conf.twilio.twilioAccountSid;
    this.authToken = conf.twilio.twilioAuthToken;
    this.client = require('twilio')(this.accountSid, this.authToken);
  };

  /**
    * Send a WhatsApp message
  */

  public async sendMessage(to: string, body: string, conf: Configs): Promise<void> {
    try {
      await this.client.messages.create({
        to,
        from: conf.twilio.twilioPhoneNumber,
        body,
      });
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    };
  };
}