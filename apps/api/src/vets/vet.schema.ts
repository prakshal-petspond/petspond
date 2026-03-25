import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class VetDocument extends Document {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  mobile!: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  veterinaryRegistrationNumber!: string;

  @Prop({ required: true })
  yearOfRegistration!: number;

  @Prop({ type: [String], default: [] })
  qualifications!: string[];

  @Prop({ type: [String], default: [] })
  specializations!: string[];

  @Prop()
  clinicId?: string;

  @Prop({ default: false })
  isClinicAdmin!: boolean;

  @Prop({ default: 'pending', enum: ['pending', 'approved'] })
  approvalStatus!: 'pending' | 'approved';

  @Prop({ default: false })
  onboardingCompleted!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const VetSchema = SchemaFactory.createForClass(VetDocument);

VetSchema.index({ mobile: 1 }, { unique: true });
VetSchema.index({ clinicId: 1 });
