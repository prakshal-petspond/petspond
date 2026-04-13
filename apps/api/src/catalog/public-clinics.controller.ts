import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ClinicsService } from '@/clinics/clinics.service';

@Controller('public/clinics')
export class PublicClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  @Get()
  async list(@Query('purpose') purpose?: string) {
    if (purpose === 'vaccination') {
      return this.clinics.listPublicVaccination();
    }
    return this.clinics.listPublicConsultation();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const d = await this.clinics.getPublicDetail(id);
    if (!d) throw new NotFoundException('Clinic not found');
    return d;
  }
}
