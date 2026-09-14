import { Module } from '@nestjs/common';
import { VetsService } from './vets.service';

@Module({
  providers: [VetsService],
  exports: [VetsService],
})
export class VetsModule {}
