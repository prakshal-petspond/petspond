import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CreatePetDto, Pet, UpdatePetDto } from '@petspond/types';
import { PetDocument } from './pet.schema';

function toPet(doc: PetDocument): Pet {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    species: doc.species,
    breed: doc.breed,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    servicesNeeded: (doc.servicesNeeded ?? []) as Pet['servicesNeeded'],
    weight: doc.weight,
    neutered: doc.neutered,
    photoUrl: doc.photoUrl,
    microchipId: doc.microchipId,
    medicalNotes: doc.medicalNotes,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

@Injectable()
export class PetsService {
  constructor(@InjectModel(PetDocument.name) private readonly petModel: Model<PetDocument>) {}

  async listByUser(userId: string): Promise<Pet[]> {
    const docs = await this.petModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return docs.map(toPet);
  }

  async findById(petId: string): Promise<Pet | null> {
    const doc = await this.petModel.findById(petId).exec();
    return doc ? toPet(doc) : null;
  }

  async assertPetOwnedByUser(petId: string, userId: string): Promise<Pet> {
    const pet = await this.findById(petId);
    if (!pet) throw new NotFoundException('Pet not found');
    if (pet.userId !== userId) throw new ForbiddenException('Not your pet');
    return pet;
  }

  async create(userId: string, dto: CreatePetDto): Promise<Pet> {
    const doc = await this.petModel.create({
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
    });
    return toPet(doc);
  }

  async update(petId: string, userId: string, dto: UpdatePetDto): Promise<Pet> {
    await this.assertPetOwnedByUser(petId, userId);
    const doc = await this.petModel
      .findByIdAndUpdate(petId, { $set: { ...dto } }, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException('Pet not found');
    return toPet(doc);
  }

  async remove(petId: string, userId: string): Promise<void> {
    await this.assertPetOwnedByUser(petId, userId);
    await this.petModel.findByIdAndDelete(petId).exec();
  }
}
