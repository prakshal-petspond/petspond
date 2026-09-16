import { Module } from '@nestjs/common';
import { ClinicStaffService } from './clinic-staff.service';

@Module({
  providers: [ClinicStaffService],
  exports: [ClinicStaffService],
})
export class ClinicStaffModule {}
