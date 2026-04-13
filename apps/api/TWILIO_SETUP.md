# Twilio SMS verification setup

This guide walks you through enabling **Twilio SMS** for login OTP in the Petspond API.

## 1. Create a Twilio account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio) and sign up.
2. Verify your email and phone if prompted.
3. You get **trial credit** — enough to test SMS. For production you’ll add payment and upgrade.

## 2. Get credentials

1. Open the [Twilio Console](https://console.twilio.com/).
2. On the dashboard you’ll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click “Show” to reveal)
3. Copy both; you’ll use them in `.env`.

## 3. Get a phone number

1. In the Twilio Console go to **Phone Numbers → Manage → Buy a number**.
2. Select your country and enable **SMS** (and optionally Voice).
3. Choose a number and complete the purchase.
4. Note the number in E.164 form (e.g. `+1234567890`).

**Trial accounts:** You can only send SMS to **verified** phone numbers. In Console go to **Phone Numbers → Manage → Verified Caller IDs** and add the numbers you want to test (e.g. your own mobile).

## 4. Configure the API

1. In `apps/api`, copy the example env and set Twilio variables:

   ```bash
   cp .env.example .env
   ```

2. Edit `apps/api/.env` and set:

   ```env
   OTP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   OTP_DEFAULT_COUNTRY_CODE=91
   ```

   - Use your **Account SID** and **Auth Token** from step 2.
   - Use the **Twilio phone number** from step 3 (include `+` and country code).
   - `OTP_DEFAULT_COUNTRY_CODE=91` is for India (10-digit numbers assumed to be +91). Change if your primary users are in another country.

3. Restart the API:

   ```bash
   pnpm --filter @petspond/api dev
   ```

## 5. Test from the app

1. Ensure the user-app points to your API (e.g. `EXPO_PUBLIC_API_URL=http://<your-api-host>:3000`).
2. On the login/onboarding screen, enter a **verified** phone number (for trial) or any number (after account upgrade).
3. Tap “Proceed” — you should receive an SMS with the 6-digit code.
4. Enter the code and complete verification.

## 6. Optional: country code from the app

For international numbers, the app can send a country code with the mobile:

- **Send OTP:** `POST /auth/send-otp` with `{ "mobile": "9876543210", "countryCode": "91" }`.
- If `countryCode` is omitted, the server uses `OTP_DEFAULT_COUNTRY_CODE` from `.env`.

## Rate limiting

The API allows **one OTP per mobile per 60 seconds** to avoid abuse and control cost. If a user requests a new code too soon, they get a clear error asking them to wait.

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| “Invalid mobile number” | Number must be at least 10 digits; with `countryCode` it’s formatted as E.164 (e.g. +91XXXXXXXXXX). |
| “SMS is not supported for this region” | In Twilio Console: **Messaging → Geo permissions** and enable the destination country. |
| “Trial accounts can only send to verified numbers” | Add the test number under **Phone Numbers → Verified Caller IDs**, or upgrade the account. |
| “Unable to send SMS” (generic) | Check the **API terminal** for a `[Twilio OTP] Send failed` log line (includes Twilio `code` and `message`). Common causes: wrong Auth Token (20003), unverified destination on trial (21608), or geo permissions. |
| OTP not received | Check Twilio **Monitor → Logs → Messaging** for delivery status and any error codes. |
| Local development | Set `OTP_PROVIDER=mock` in `apps/api/.env.local` — the OTP is printed in the API console; no SMS is sent. |

## Production checklist

- [ ] Upgrade Twilio account and add payment method.
- [ ] Use a persistent OTP store (e.g. Redis) instead of in-memory — see `otp.store.ts` and `otp-rate-limit.ts`.
- [ ] Restrict CORS and set a proper `JWT_SECRET` for issued tokens after verify-otp.
- [ ] Optionally use [Twilio Verify](https://www.twilio.com/docs/verify) for built-in rate limiting and fraud controls (would require replacing the current send/verify flow with Verify API).
