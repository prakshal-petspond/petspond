import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '@petspond/types';
import { PetsService } from './pets.service';
import { CreatePetBodyDto } from './dto/create-pet.dto';

@Controller('user/pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.pets.listByUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreatePetBodyDto) {
    return this.pets.create(user.id, {
      ...body,
      servicesNeeded: body.servicesNeeded ?? [],
    });
  }

  @Patch(':petId')
  update(@CurrentUser() user: User, @Param('petId') petId: string, @Body() body: CreatePetBodyDto) {
    return this.pets.update(petId, user.id, body);
  }

  @Delete(':petId')
  remove(@CurrentUser() user: User, @Param('petId') petId: string) {
    return this.pets.remove(petId, user.id);
  }
}
