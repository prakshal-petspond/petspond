import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Clinic } from '@petspond/types';
import { ClinicDocument } from './clinic.schema';

function toClinic(doc: ClinicDocument): Clinic {
  return {
    id: doc._id.toString(),
    name: doc.name,
    totalDoctors: doc.totalDoctors ?? 1,
    address: doc.address,
    pincode: doc.pincode,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    latitude: doc.latitude,
    longitude: doc.longitude,
    placeId: doc.placeId,
    adminVetId: doc.adminVetId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(ClinicDocument.name) private readonly clinicModel: Model<ClinicDocument>,
  ) {}

  async findAll(): Promise<Clinic[]> {
    const docs = await this.clinicModel.find().sort({ name: 1 }).exec();
    return docs.map(toClinic);
  }

  async findById(id: string): Promise<Clinic | null> {
    const doc = await this.clinicModel.findById(id).exec();
    return doc ? toClinic(doc) : null;
  }

  async create(data: {
    name: string;
    totalDoctors: number;
    address: string;
    pincode: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    adminVetId: string;
  }): Promise<Clinic> {
    const doc = await this.clinicModel.create(data);
    return toClinic(doc);
  }
}
