import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VetJwtAuthGuard } from '@/vet-auth/vet-jwt-auth.guard';
import { CurrentVet } from '@/vet-auth/current-vet.decorator';
import type { Vet } from '@petspond/types';
import { ApprovedVetGuard } from './approved-vet.guard';
import { FrontDeskService } from './front-desk.service';
import { CollectPaymentDto, CreateWalkInDto, UpdateQueueStatusDto } from './dto/front-desk.dto';

@Controller('vet/front-desk')
@UseGuards(VetJwtAuthGuard, ApprovedVetGuard)
export class VetFrontDeskController {
  constructor(private readonly frontDesk: FrontDeskService) {}

  @Get('check-in')
  getCheckIn(@CurrentVet() vet: Vet) {
    return this.frontDesk.getCheckInBoard(vet);
  }

  @Get('search')
  search(@CurrentVet() vet: Vet, @Query('q') q: string) {
    return this.frontDesk.search(vet, q ?? '');
  }

  @Post('consultations/:id/check-in')
  checkIn(@CurrentVet() vet: Vet, @Param('id') id: string) {
    return this.frontDesk.checkIn(vet, id);
  }

  @Post('consultations/walk-in')
  walkIn(@CurrentVet() vet: Vet, @Body() dto: CreateWalkInDto) {
    return this.frontDesk.createWalkIn(vet, dto);
  }

  @Patch('consultations/:id/no-show')
  noShow(@CurrentVet() vet: Vet, @Param('id') id: string) {
    return this.frontDesk.markNoShow(vet, id);
  }

  @Get('queue')
  getQueue(@CurrentVet() vet: Vet) {
    return this.frontDesk.getQueue(vet);
  }

  @Patch('consultations/:id/queue')
  updateQueue(
    @CurrentVet() vet: Vet,
    @Param('id') id: string,
    @Body() body: UpdateQueueStatusDto,
  ) {
    return this.frontDesk.updateQueueStatus(
      vet,
      id,
      body.queueStatus,
      body.roomLabel,
      body.vetId,
    );
  }

  @Get('payments')
  getPayments(
    @CurrentVet() vet: Vet,
    @Query('filter') filter?: 'all' | 'pending' | 'paid' | 'refunded',
  ) {
    return this.frontDesk.getPayments(vet, filter ?? 'all');
  }

  @Post('consultations/:id/collect-payment')
  collectPayment(
    @CurrentVet() vet: Vet,
    @Param('id') id: string,
    @Body() dto: CollectPaymentDto,
  ) {
    return this.frontDesk.collectPayment(vet, id, dto);
  }
}
