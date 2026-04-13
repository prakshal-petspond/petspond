import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '@petspond/types';
import { BookingsService } from './bookings.service';
import {
  ConfirmPaymentBodyDto,
  CreateConsultationBodyDto,
  CreateVaccinationBodyDto,
} from './dto/user-bookings.dto';

@Controller('user/bookings')
@UseGuards(JwtAuthGuard)
export class UserBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('consultations')
  createConsultation(@CurrentUser() user: User, @Body() body: CreateConsultationBodyDto) {
    return this.bookings.createConsultation(user.id, body);
  }

  @Post('consultations/:id/confirm-payment')
  confirmConsultation(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: ConfirmPaymentBodyDto,
  ) {
    return this.bookings.confirmConsultationPayment(user.id, id, body.stripeSessionId);
  }

  @Get('consultations')
  listConsultations(@CurrentUser() user: User) {
    return this.bookings.listConsultationsForUser(user.id);
  }

  @Post('vaccinations')
  createVaccination(@CurrentUser() user: User, @Body() body: CreateVaccinationBodyDto) {
    return this.bookings.createVaccination(user.id, body);
  }

  @Post('vaccinations/:id/confirm-payment')
  confirmVaccination(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: ConfirmPaymentBodyDto,
  ) {
    return this.bookings.confirmVaccinationPayment(user.id, id, body.stripeSessionId);
  }

  @Get('vaccinations')
  listVaccinations(@CurrentUser() user: User) {
    return this.bookings.listVaccinationsForUser(user.id);
  }
}
