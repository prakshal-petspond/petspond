import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VetJwtAuthGuard } from '@/vet-auth/vet-jwt-auth.guard';
import { CurrentVet } from '@/vet-auth/current-vet.decorator';
import type { Vet } from '@petspond/types';
import { ApprovedVetGuard } from './approved-vet.guard';
import { ClinicDirectoryService } from './clinic-directory.service';

@Controller('vet/directory')
@UseGuards(VetJwtAuthGuard, ApprovedVetGuard)
export class VetDirectoryController {
  constructor(private readonly directory: ClinicDirectoryService) {}

  @Get('pets')
  listPets(@CurrentVet() vet: Vet) {
    return this.directory.listPets(vet);
  }

  @Get('owners')
  listOwners(@CurrentVet() vet: Vet) {
    return this.directory.listOwners(vet);
  }

  @Get('owners/:ownerId')
  getOwner(@CurrentVet() vet: Vet, @Param('ownerId') ownerId: string) {
    return this.directory.getOwnerProfile(vet, ownerId);
  }
}
