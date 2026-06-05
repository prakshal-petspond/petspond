import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class WeeklyAvailabilityBlock {
  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek!: number;

  @Prop({ required: true, min: 0, max: 1439 })
  startMinute!: number;

  @Prop({ required: true, min: 1, max: 1440 })
  endMinute!: number;
}

@Schema({ timestamps: true, _id: true })
export class VendorDocument extends Document {
  @Prop({ required: true, unique: true })
  mobile!: string;

  @Prop({ default: '' })
  businessName!: string;

  @Prop()
  displayTitle?: string;

  @Prop()
  bio?: string;

  @Prop()
  photoUrl?: string;

  @Prop({ type: [String], default: [], enum: ['grooming', 'training', 'walking'] })
  serviceTypes!: ('grooming' | 'training' | 'walking')[];

  @Prop({ type: [String], default: [], enum: ['on_site', 'doorstep'] })
  serviceModes!: ('on_site' | 'doorstep')[];

  @Prop({ default: 0 })
  latitude!: number;

  @Prop({ default: 0 })
  longitude!: number;

  @Prop({ default: '' })
  address!: string;

  @Prop()
  city?: string;

  @Prop({ default: 10 })
  serviceRadiusKm!: number;

  @Prop({ type: [WeeklyAvailabilityBlock], default: [] })
  weeklyAvailability!: WeeklyAvailabilityBlock[];

  @Prop({ default: 4.5 })
  rating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop()
  promo?: string;

  @Prop({ default: false })
  onboardingCompleted!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const VendorSchema = SchemaFactory.createForClass(VendorDocument);
VendorSchema.index({ mobile: 1 }, { unique: true });
VendorSchema.index({ serviceTypes: 1, onboardingCompleted: 1, isActive: 1 });
VendorSchema.index({ latitude: 1, longitude: 1 });
