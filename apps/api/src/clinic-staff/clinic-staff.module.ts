import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicStaffDocument, ClinicStaffSchema } from './clinic-staff.schema';
import { ClinicStaffService } from './clinic-staff.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClinicStaffDocument.name, schema: ClinicStaffSchema }]),
  ],
  providers: [ClinicStaffService],
  exports: [ClinicStaffService],
})
export class ClinicStaffModule {}
