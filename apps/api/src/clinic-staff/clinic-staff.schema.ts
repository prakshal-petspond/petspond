import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClinicStaffRole = 'front_office';

@Schema({ timestamps: true, _id: true })
export class ClinicStaffDocument extends Document {
  @Prop({ required: true, index: true })
  clinicId!: string;

  @Prop({ required: true, enum: ['front_office'], default: 'front_office' })
  role!: ClinicStaffRole;

  @Prop({ required: true })
  fullName!: string;

  @Prop()
  email?: string;

  @Prop()
  mobile?: string;

  @Prop({ required: true })
  createdByVetId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicStaffSchema = SchemaFactory.createForClass(ClinicStaffDocument);

ClinicStaffSchema.index({ clinicId: 1, role: 1 });
