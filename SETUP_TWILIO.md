# Twilio Setup for WhatsApp and SMS

This project can send messages via Twilio (SMS and WhatsApp) and receive WhatsApp replies.

## 1) Backend Environment

Create/update `backend/.env` with:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_FROM=+15551234567                 # SMS-capable number
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886    # Twilio Sandbox or approved sender
```

Restart the backend after changes.

## 2) WhatsApp Webhook

Expose the backend and set the webhook in Twilio Console:

- URL: `POST https://<your-domain>/whatsapp/webhook`
- Content Type: `application/x-www-form-urlencoded`

When testing locally, use a tunnel (e.g., ngrok) and point Twilio to the tunneled URL.

## 3) Data Requirements

- Leads must have `phone` in E.164 format (e.g., `+15551234567`) to receive WhatsApp/SMS.
- Create campaigns with channel `whatsapp` to broadcast via WhatsApp.

## 4) Notes

- Inbound WhatsApp messages are stored in the `messages` table as `channel = 'whatsapp'` and `direction = 'inbound'`.
- Outbound WhatsApp is supported in automated sequences.

