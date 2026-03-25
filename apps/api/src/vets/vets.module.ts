import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VetDocument, VetSchema } from './vet.schema';
import { VetsService } from './vets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VetDocument.name, schema: VetSchema }]),
  ],
  providers: [VetsService],
  exports: [VetsService],
})
export class VetsModule {}
