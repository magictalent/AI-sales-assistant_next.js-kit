import { Injectable } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class WhatsappService {
  private client: twilio.Twilio | null = null;
  private from: string | undefined;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_WHATSAPP_FROM; // format: 'whatsapp:+14155238886'
    if (sid && token) this.client = twilio(sid, token);
  }

  async send(to: string, body: string) {
    if (!this.client || !this.from) throw new Error('Twilio WhatsApp not configured');
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await this.client.messages.create({ from: this.from, to: toFormatted, body });
    return { success: true };
  }
}

