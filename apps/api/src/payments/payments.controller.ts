import { Body, Controller, Post } from '@nestjs/common';
import { CreateVetCheckoutDto } from './dto/create-vet-checkout.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Creates a Stripe Checkout session for a vet booking (or returns mock mode if Stripe is not configured). */
  @Post('vet-booking/checkout')
  createVetCheckout(@Body() dto: CreateVetCheckoutDto) {
    return this.payments.createVetBookingCheckout(dto);
  }
}
