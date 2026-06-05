import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClinicStaffRole = 'front_office' | 'veterinarian';

@Schema({ timestamps: true, _id: true })
export class ClinicStaffDocument extends Document {
  @Prop({ required: true, index: true })
  clinicId!: string;

  @Prop({ required: true, enum: ['front_office', 'veterinarian'] })
  role!: ClinicStaffRole;

  @Prop({ required: true })
  fullName!: string;

  @Prop()
  email?: string;

  @Prop()
  mobile?: string;

  /** Veterinarian-only: medical license / registration number */
  @Prop()
  veterinaryRegistrationNumber?: string;

  @Prop({ type: [String], default: [] })
  specializations!: string[];

  /** Set when a pending veterinarian joins via OTP and links their Vet account */
  @Prop()
  linkedVetId?: string;

  @Prop({ required: true })
  createdByVetId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicStaffSchema = SchemaFactory.createForClass(ClinicStaffDocument);

ClinicStaffSchema.index({ clinicId: 1, role: 1 });
