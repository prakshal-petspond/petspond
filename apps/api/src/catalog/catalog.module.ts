import { Module } from '@nestjs/common';
import { ClinicsModule } from '@/clinics/clinics.module';
import { PublicClinicsController } from './public-clinics.controller';

@Module({
  imports: [ClinicsModule],
  controllers: [PublicClinicsController],
})
export class CatalogModule {}
