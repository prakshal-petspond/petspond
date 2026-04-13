import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PetDocument, PetSchema } from './pet.schema';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: PetDocument.name, schema: PetSchema }]), AuthModule],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
