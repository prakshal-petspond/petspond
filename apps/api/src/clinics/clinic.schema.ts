import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class HourEntry {
  @Prop({ required: true }) day!: string;
  @Prop({ required: true }) hours!: string;
}

@Schema({ _id: false })
class ServiceOfferedEntry {
  @Prop({ required: true }) id!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) icon!: string;
}

@Schema({ _id: false })
class VaccineOfferedEntry {
  @Prop({ required: true }) id!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) pricePaise!: number;
}

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

  @Prop()
  listingImage?: string;

  @Prop()
  heroImage?: string;

  @Prop()
  tagline?: string;

  @Prop({ default: 4.5 })
  rating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({ default: false })
  is24_7!: boolean;

  @Prop()
  closingTimeLabel?: string;

  @Prop({ type: [HourEntry], default: [] })
  hours!: HourEntry[];

  @Prop({ type: [String], default: [] })
  facilities!: string[];

  @Prop({ type: [String], default: [] })
  photoGallery!: string[];

  @Prop({ type: [ServiceOfferedEntry], default: [] })
  servicesOffered!: ServiceOfferedEntry[];

  @Prop({ type: [VaccineOfferedEntry], default: [] })
  vaccinesOffered!: VaccineOfferedEntry[];

  @Prop({ default: true })
  acceptsConsultations!: boolean;

  @Prop({ default: true })
  acceptsVaccinations!: boolean;

  @Prop()
  establishedYear?: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicSchema = SchemaFactory.createForClass(ClinicDocument);

ClinicSchema.index({ adminVetId: 1 });
ClinicSchema.index({ pincode: 1 });
