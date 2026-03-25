# Fast2SMS OTP setup

This guide explains how to use **Fast2SMS** for sending OTP SMS in the Petspond API (user login and vet login).

## 1. Create a Fast2SMS account

1. Go to [fast2sms.com](https://www.fast2sms.com) and sign up.
2. Complete verification and add credits if required (Fast2SMS is India-focused and uses prepaid credits).

## 2. Get your API key

1. Log in to the Fast2SMS dashboard.
2. Go to **Dev API** or **API** section and find your **API Key** (authorization key).
3. Copy the key; you will use it in `.env` as `FAST2SMS_API_KEY`.

## 3. OTP / DLT (India)

For sending OTP in India you may need to:

- **Website verification (required for OTP Message API):**  
  If you see *"Before using OTP Message API, complete website verification"*:
  1. Log in to [Fast2SMS Dashboard](https://www.fast2sms.com/dashboard).
  2. Open the **OTP Message** menu (or **Dev API** → OTP).
  3. Complete **website verification** as shown there (e.g. add your domain/site and verify).
  4. After verification is approved, the OTP Message API will work with `route: "otp"`.
- Alternatively, use the **DLT SMS API** (different endpoint; requires DLT sender ID and template). Contact Fast2SMS support or see their DLT docs if you prefer that route.

Check Fast2SMS docs for current DLT and template requirements.

## 4. Configure the API

1. In `apps/api`, copy the example env if you haven’t already:

   ```bash
   cp .env.example .env
   ```

2. Set the OTP provider and API key:

   ```env
   OTP_PROVIDER=fast2sms
   FAST2SMS_API_KEY=your_api_key_here
   OTP_DEFAULT_COUNTRY_CODE=91
   ```

   - `OTP_DEFAULT_COUNTRY_CODE=91` is for Indian 10-digit numbers. Omit or change if you use a different default.

3. Restart the API:

   ```bash
   pnpm --filter @petspond/api dev
   ```

## 5. Test

- Use the **user app** or **Vet CRM** login flow: enter a valid Indian mobile number and request OTP.
- You should receive an SMS with the OTP. If Fast2SMS returns an error, the API will respond with a user-friendly message (e.g. invalid number, insufficient balance).

## 6. Other providers

- **Mock (development):** Set `OTP_PROVIDER=mock` or leave it unset. OTP is printed in the API console.
- **Twilio:** Set `OTP_PROVIDER=twilio` and the `TWILIO_*` variables. See `TWILIO_SETUP.md`.

## 7. Troubleshooting

| Issue | What to check |
|--------|----------------|
| "Before using OTP Message API, complete website verification" | Complete **website verification** in the Fast2SMS dashboard: go to **OTP Message** (or Dev API → OTP) and follow the verification steps for your site/domain. Until that is done, the OTP Message API will not send. Alternatively use their DLT SMS API if you have DLT set up. |
| "OTP service not ready. Complete website verification..." | Same as above: complete website verification in Fast2SMS (OTP Message menu). |
| "Invalid mobile number" | Number must be 10 digits (or 10 digits after country code). Fast2SMS expects Indian numbers in the format used by the API. |
| "Insufficient balance" / "Failed to send" | Add credits in the Fast2SMS dashboard. |
| DLT / template errors | Ensure your sender ID and OTP template are approved on DLT and configured in Fast2SMS. |
| 401 / unauthorized | Confirm `FAST2SMS_API_KEY` is correct and has no extra spaces or quotes. |
