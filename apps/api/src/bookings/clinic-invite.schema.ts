import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class ClinicInviteDocument extends Document {
  @Prop({ required: true, index: true })
  clinicId!: string;

  /** Normalized 10-digit mobile */
  @Prop({ required: true, index: true })
  mobile!: string;

  @Prop({ required: true })
  createdByVetId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicInviteSchema = SchemaFactory.createForClass(ClinicInviteDocument);

ClinicInviteSchema.index({ clinicId: 1, mobile: 1 }, { unique: true });
