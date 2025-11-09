import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SupabaseClient } from '@supabase/supabase-js';
import { Inject } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

// Twilio WhatsApp inbound webhook handler
// Route: POST /whatsapp/webhook
// Content-Type: application/x-www-form-urlencoded
// Relevant fields: From (e.g. 'whatsapp:+15551234567'), Body, WaId (digits), ProfileName

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(@Body() body: any) {
    try {
      const from: string = body.From || body.from || '';
      const text: string = body.Body || body.body || '';
      const waId: string = body.WaId || body.waId || '';
      const profile: string = body.ProfileName || '';

      const rawPhone = (from || waId || '').toString();
      if (!rawPhone) return { ok: false, reason: 'missing_from' };

      const phone = rawPhone.replace(/^whatsapp:/i, '');

      // Find lead by phone
      let lead: any = null;
      try {
        const { data } = await this.supabase
          .from('leads')
          .select('id,first_name,last_name,email,phone')
          .eq('phone', phone)
          .maybeSingle();
        lead = data || null;
      } catch {}

      // Try to infer campaign from most recent outbound WhatsApp to this lead
      let campaignId: string | null = null;
      try {
        if (lead?.id) {
          const { data: last } = await this.supabase
            .from('messages')
            .select('campaign_id')
            .eq('lead_id', lead.id)
            .eq('channel', 'whatsapp')
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          campaignId = (last as any)?.campaign_id || null;
        }
      } catch {}

      // Insert inbound message row
      const leadName = lead ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || profile || 'WhatsApp Lead' : profile || 'WhatsApp Lead';
      const leadEmail = lead?.email || '';
      const leadId = lead?.id || null;

      await this.supabase.from('messages').insert({
        campaign_id: campaignId,
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        lead_phone: phone,
        channel: 'whatsapp',
        content: text || '',
        status: 'replied',
        direction: 'inbound',
      });

      // Best-effort: update lead status
      try {
        if (leadId) {
          await this.supabase
            .from('leads')
            .update({ status: 'replied', updated_at: new Date().toISOString() })
            .eq('id', leadId);
        }
      } catch {}

      // Respond quickly to Twilio
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'error' };
    }
  }

  @Public()
  @Post('send-test')
  async sendTest(@Body() body: { to: string; text?: string }) {
    if (!body?.to) throw new Error('Missing to');
    const res = await this.whatsapp.send(body.to, body.text || 'Test from AI Sales Agents');
    return { ok: true, result: res };
  }
}
