import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class ClinicDocument extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: 1 })
  totalDoctors!: number;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  pincode!: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  placeId?: string;

  @Prop({ required: true })
  adminVetId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicSchema = SchemaFactory.createForClass(ClinicDocument);

ClinicSchema.index({ adminVetId: 1 });
