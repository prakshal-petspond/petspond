import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Pet as PetRow } from '@prisma/client';
import type { CreatePetDto, Pet, UpdatePetDto } from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';

function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    species: row.species as Pet['species'],
    breed: row.breed,
    dateOfBirth: row.dateOfBirth ?? undefined,
    gender: (row.gender as Pet['gender'] | null) ?? undefined,
    servicesNeeded: (row.servicesNeeded ?? []) as Pet['servicesNeeded'],
    weight: row.weight ?? undefined,
    neutered: row.neutered ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    microchipId: row.microchipId ?? undefined,
    medicalNotes: row.medicalNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(o)) {
    const v = o[k as keyof T];
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(userId: string): Promise<Pet[]> {
    const rows = await this.prisma.pet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPet);
  }

  async findById(petId: string): Promise<Pet | null> {
    const row = await this.prisma.pet.findUnique({ where: { id: petId } });
    return row ? toPet(row) : null;
  }

  async assertPetOwnedByUser(petId: string, userId: string): Promise<Pet> {
    const pet = await this.findById(petId);
    if (!pet) throw new NotFoundException('Pet not found');
    if (pet.userId !== userId) throw new ForbiddenException('Not your pet');
    return pet;
  }

  async create(userId: string, dto: CreatePetDto): Promise<Pet> {
    const row = await this.prisma.pet.create({
      data: {
        userId,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        servicesNeeded: dto.servicesNeeded ?? [],
        weight: dto.weight,
        neutered: dto.neutered,
        photoUrl: dto.photoUrl,
        microchipId: dto.microchipId,
        medicalNotes: dto.medicalNotes,
      },
    });
    return toPet(row);
  }

  async update(petId: string, userId: string, dto: UpdatePetDto): Promise<Pet> {
    await this.assertPetOwnedByUser(petId, userId);
    try {
      const row = await this.prisma.pet.update({
        where: { id: petId },
        data: stripUndefined(dto as unknown as Record<string, unknown>),
      });
      return toPet(row);
    } catch {
      throw new NotFoundException('Pet not found');
    }
  }

  async remove(petId: string, userId: string): Promise<void> {
    await this.assertPetOwnedByUser(petId, userId);
    await this.prisma.pet.delete({ where: { id: petId } });
  }
}
