import { Module } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { VetsModule } from '@/vets/vets.module';

@Module({
  imports: [VetsModule],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
