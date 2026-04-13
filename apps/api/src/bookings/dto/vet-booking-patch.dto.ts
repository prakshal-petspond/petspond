import { IsIn, IsString } from 'class-validator';

const consultationStatuses = [
  'pending_payment',
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const;

const vaccinationStatuses = consultationStatuses;

export class PatchConsultationStatusDto {
  @IsString()
  @IsIn(consultationStatuses)
  status!: (typeof consultationStatuses)[number];
}

export class PatchVaccinationStatusDto {
  @IsString()
  @IsIn(vaccinationStatuses)
  status!: (typeof vaccinationStatuses)[number];
}
