import { Telegraf, Context, Markup } from 'telegraf';
import {  message } from 'telegraf/filters';
import { Configs } from '../config/config';
import { Application } from 'express';
import axios from 'axios';
import { User } from '../store/userModel';

export class TelegramClient {
  private bot: Telegraf<Context>;

  constructor(public readonly config: Configs) {
    this.bot = new Telegraf(config.telegram.telegramToken);
    console.log('Launching Telegram Bot...');
  }

  private registerCommands() {
    this.bot.command('start', this.startCommand());
    this.bot.command('buy', this.payCommand());
    this.bot.command('help', this.helpCommand());

    this.bot.action('pay', this.payAction());
    this.bot.action('generate_login', this.generateLoginAction());

    // this.bot.on('text', this.handleEmailReply());
    this.bot.on(message('text'), this.handleEmailReply());

    console.log('✅ Telegram commands registered successfully...');
  }

  public initBot() {
    this.registerCommands();
    this.bot.launch()
      .then(() => console.log('✅ Telegram bot is running...'))
      .catch((e: any) => console.error(`❌ Failed to launch bot: ${e.message}`));
  }

  public initWebhook(app: Application, webhookPath: string, webhookUrl: string): Telegraf<Context> {
    this.registerCommands();

    this.bot.telegram.setWebhook(`${webhookUrl}${webhookPath}`)
      .then(() => console.log('✅ Webhook configured successfully...'))
      .catch((e: any) => console.error(`❌ Failed to set webhook: ${e.message}`));

    app.use(webhookPath, this.bot.webhookCallback(webhookPath));
    return this.bot;
  }

  // ---- COMMANDS ---- //

  private startCommand() {
    return async (ctx: Context) => {
      await ctx.reply(
        `👋 Welcome to *Kab Connect*!\n\n📶 Get 24-hour Internet access for just *₦500*.\n\nStay connected. — Kab Connect`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply(
        `To continue, you’ll pay through our secure platform using a *bank transfer* or *debit card*. Once payment is complete, you’ll receive a *login* to get online.`,
        Markup.inlineKeyboard([
          Markup.button.callback('🚀 Proceed to Payment', 'pay'),
        ])
      );
    };
  }

  private payCommand() {
    return async (ctx: Context) => {
      await ctx.reply('To start your purchase, use the /start command and tap "Proceed to Payment".');
    };
  }

  private helpCommand() {
    return async (ctx: Context) => {
      await ctx.reply(`ℹ️ Available Commands:\n/start - Begin\n/buy - Start purchase\n/help - Show help`);
    };
  }

  // ---- ACTIONS ---- //

  private payAction() {
    return async (ctx: Context) => {
      await ctx.answerCbQuery();
      const telegramId = ctx.from?.id;

      if (!telegramId) {
        await ctx.reply('❌ Could not detect your Telegram ID.');
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ telegramId });

      if (!existingUser) {
        // Ask for their email only once
        await ctx.reply(
          '📧 Please enter your email address to proceed with payment:',
          Markup.forceReply()
        );

        // Save new user with empty email
        const newUser = new User({ telegramId, email: '', isActive: false });
        await newUser.save();
        console.log(`✅ New user created with Telegram ID: ${telegramId}`);
      } else {
        // If user exists and has email, proceed to payment immediately
        if (existingUser.email) {
          await this.initiatePayment(ctx, existingUser.email);
        } else {
          // Ask for email again if missing (edge case)
          await ctx.reply(
            '📧 Please enter your email address to proceed with payment:',
            Markup.forceReply()
          );
        }
      }
    };
  }

  private handleEmailReply() {
    return async (ctx: Context) => {
      if (!ctx.message || typeof ctx.message !== 'object' || !('text' in ctx.message)) {
      await ctx.reply('❌ Please send a text message.');
      return;
    }

    const text = ctx.message.text.trim();
    const telegramId = ctx.from?.id;

    if (!telegramId || !text) return;

      const user = await User.findOne({ telegramId });

      // Proceed only if user exists and has no email set yet
      if (user && !user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(text)) {
          await ctx.reply('❌ Invalid email. Please enter a valid email address.');
          return;
        }

        // Save email and continue to payment
        user.email = text;
        await user.save();

        await ctx.reply('✅ Email saved! Generating payment link...');
        await this.initiatePayment(ctx, text);
      }
    };
  }

  private async initiatePayment(ctx: Context, email: string) {
    const telegramId = ctx.from?.id;
    const amount = 500 * 100; // in kobo

    try {
      const response = await axios.post(`${this.config.appUrl}/payment/init`, {
        email,
        amount,
        metadata: { telegramId },
      });

      const result = response.data;

      if (result.status === 'success') {
        const link = result.data.authorization_url;

        await ctx.reply(
          `💳 Click below to complete your ₦500 payment:`,
          Markup.inlineKeyboard([
            Markup.button.url('🚀 Pay Now', link),
            Markup.button.callback('✅ I’ve Paid, Generate Login', 'generate_login'),
          ])
        );
      } else {
        await ctx.reply(`❌ Payment init failed: ${result.message}`);
      }
    } catch (e: any) {
      console.error(`❌ Payment error: ${e.message}`);
      await ctx.reply('❌ Could not initiate payment. Try again later.');
    }
  }

  private generateLoginAction() {
    return async (ctx: Context) => {
      await ctx.answerCbQuery();

      const username = `kab_${Math.random().toString(36).substring(2, 6)}`;
      const password = Math.random().toString(36).substring(2, 8);

      await ctx.reply(
        `🔐 *Your Wi-Fi Login*\n\n*Username:* \`${username}\`\n*Password:* \`${password}\`\n\nUse these credentials to log into the Kab Connect Wi-Fi network. Enjoy!`,
        { parse_mode: 'Markdown' }
      );
    };
  }
}
