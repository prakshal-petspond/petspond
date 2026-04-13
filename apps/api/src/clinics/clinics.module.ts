import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicDocument, ClinicSchema } from './clinic.schema';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { VetsModule } from '@/vets/vets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClinicDocument.name, schema: ClinicSchema }]),
    VetsModule,
  ],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
