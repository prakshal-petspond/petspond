import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateVetCheckoutDto } from './dto/create-vet-checkout.dto';

export type VetCheckoutResult =
  | { mode: 'stripe'; url: string }
  | { mode: 'mock'; message: string };

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  async createVetBookingCheckout(dto: CreateVetCheckoutDto): Promise<VetCheckoutResult> {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      this.log.warn('STRIPE_SECRET_KEY not set — returning mock checkout mode');
      return {
        mode: 'mock',
        message: 'Stripe is not configured on the server. The app will complete payment in demo mode.',
      };
    }

    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: dto.amountPaise,
            product_data: {
              name: 'Veterinary appointment',
              description: dto.description.slice(0, 500),
            },
          },
          quantity: 1,
        },
      ],
      success_url: dto.successUrl.includes('{CHECKOUT_SESSION_ID}')
        ? dto.successUrl
        : `${dto.successUrl.replace(/\?$/, '')}${dto.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dto.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe Checkout session missing URL');
    }

    return { mode: 'stripe', url: session.url };
  }
}
