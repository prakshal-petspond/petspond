import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { ApiClient } from '@petspond/api-client';

export type VetCheckoutResponse =
  | { mode: 'stripe'; url: string }
  | { mode: 'mock'; message: string };

/**
 * Starts vet booking payment: opens Stripe Checkout in the browser when the API returns a session URL,
 * otherwise indicates demo/mock mode (no charge).
 *
 * Stripe Checkout expects an HTTPS success URL (or a universal link). In Expo Go, `Linking.createURL`
 * is often `exp://…`, which Stripe may reject — use a dev/prod HTTPS redirect page via
 * EXPO_PUBLIC_PAYMENT_SUCCESS_URL / EXPO_PUBLIC_PAYMENT_CANCEL_URL when testing real Checkout.
 */
export async function startVetBookingCheckout(
  client: ApiClient,
  params: {
    amountPaise: number;
    vetId: string;
    description: string;
  },
): Promise<
  | { status: 'paid'; stripeSessionId?: string }
  | { status: 'mock_ok' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }
> {
  const successUrl =
    process.env.EXPO_PUBLIC_PAYMENT_SUCCESS_URL ?? Linking.createURL('payment/vet-success');
  const cancelUrl =
    process.env.EXPO_PUBLIC_PAYMENT_CANCEL_URL ?? Linking.createURL('payment/vet-cancel');

  let res: VetCheckoutResponse;
  try {
    res = await client.post<VetCheckoutResponse>('/payments/vet-booking/checkout', {
      amountPaise: params.amountPaise,
      vetId: params.vetId,
      description: params.description,
      successUrl,
      cancelUrl,
    });
  } catch (e) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Payment request failed';
    return { status: 'error', message };
  }

  if (res.mode === 'mock') {
    return { status: 'mock_ok' };
  }

  try {
    const auth = await WebBrowser.openAuthSessionAsync(res.url, successUrl);
    if (auth.type === 'success' && auth.url) {
      let sessionId: string | null = null;
      try {
        sessionId = new URL(auth.url).searchParams.get('session_id');
      } catch {
        sessionId = null;
      }
      return { status: 'paid', stripeSessionId: sessionId ?? undefined };
    }
    if (auth.type === 'cancel') {
      return { status: 'cancelled' };
    }
    return { status: 'error', message: 'Payment was not completed' };
  } finally {
    WebBrowser.maybeCompleteAuthSession();
  }
}
