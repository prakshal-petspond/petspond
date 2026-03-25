# MSG91 OTP setup

This guide explains how to use **MSG91** for sending OTP SMS in the Petspond API (user login and vet login).

## 1. Create an MSG91 account

1. Go to [msg91.com](https://msg91.com) and sign up.
2. Complete verification and add credits if required.

## 2. Get your Auth Key

1. Log in to the [MSG91 dashboard](https://control.msg91.com).
2. Go to **API** or **Settings** and find your **Authentication Key** (authkey).
3. Copy the key; you will use it in `.env` as `MSG91_AUTH_KEY`.

## 3. OTP / DLT (India)

For sending OTP in India you may need to:

- **DLT registration:** Register your sender ID and OTP template on the DLT portal and link them in MSG91.
- **Template:** Use the default OTP message or create an OTP template in MSG91 with placeholder `##OTP##` if you use a custom message.
- **Sender ID:** Optional; set `MSG91_SENDER` in `.env` if your account uses a specific sender ID.

See [MSG91 OTP docs](https://docs.msg91.com/otp) and [DLT help](https://msg91.com/help) for current requirements.

## 4. Configure the API

1. In `apps/api`, copy the example env if you haven’t already:

   ```bash
   cp .env.example .env
   ```

2. Set the OTP provider and auth key:

   ```env
   OTP_PROVIDER=msg91
   MSG91_AUTH_KEY=your_auth_key_here
   OTP_DEFAULT_COUNTRY_CODE=91
   ```

   - `OTP_DEFAULT_COUNTRY_CODE=91` is for Indian 10-digit numbers. Omit or change if you use a different default.
   - Optional: `MSG91_SENDER=YourSenderID` if your account requires a specific sender ID.

3. Restart the API:

   ```bash
   pnpm --filter @petspond/api dev
   ```

## 5. Test

- Use the **user app** or **Vet CRM** login flow: enter a valid mobile number and request OTP.
- You should receive an SMS with the OTP. If MSG91 returns an error, the API will respond with a short message (e.g. invalid auth, template/DLT issue).

## 6. Other providers

- **Mock (development):** Set `OTP_PROVIDER=mock` or leave it unset. OTP is printed in the API console.
- **Fast2SMS:** Set `OTP_PROVIDER=fast2sms` and `FAST2SMS_API_KEY`. See `FAST2SMS_SETUP.md`.
- **Twilio:** Set `OTP_PROVIDER=twilio` and the `TWILIO_*` variables. See `TWILIO_SETUP.md`.

## 7. Troubleshooting

| Issue | What to check |
|--------|----------------|
| "Invalid authentication key" / 207 | Confirm `MSG91_AUTH_KEY` is correct and has no extra spaces or quotes. |
| Template / DLT errors | Register sender ID and OTP template on DLT; link them in MSG91 and ensure template uses `##OTP##`. |
| IP whitelist / 418 | If your account has IP whitelisting, add your server’s IP in the MSG91 dashboard. |
| "Invalid mobile number" | Number must be 10+ digits or include country code. We send mobile in international format (e.g. 919876543210). |
| "OTP service configuration issue" | Check auth key, template, and IP whitelist in MSG91; or use `OTP_PROVIDER=mock` for local testing. |
| No error but SMS not received | In the API terminal you should see `[OTP] Sent to ***XXXX via msg91`. If that appears, MSG91 accepted the request; check the MSG91 dashboard for delivery logs and ensure your DLT sender/template are approved. For quick testing without SMS, use `OTP_PROVIDER=mock` and read the OTP from the API console. |
