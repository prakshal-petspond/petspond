import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class ConsultationBookingDocument extends Document {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  clinicId!: string;

  @Prop({ required: true })
  vetId!: string;

  @Prop({ required: true })
  petId!: string;

  @Prop({ required: true })
  petName!: string;

  @Prop({ required: true })
  petSpecies!: string;

  @Prop({ required: true })
  petBreed!: string;

  @Prop()
  petWeightLabel?: string;

  @Prop({ type: [String], default: [] })
  reasonIds!: string[];

  @Prop()
  notes?: string;

  @Prop({ required: true })
  scheduledAt!: Date;

  @Prop({
    required: true,
    enum: ['pending_payment', 'scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'pending_payment',
  })
  status!: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';

  @Prop({ required: true, enum: ['pending', 'paid', 'failed'], default: 'pending' })
  paymentStatus!: 'pending' | 'paid' | 'failed';

  @Prop({ required: true })
  consultationFeePaise!: number;

  @Prop({ required: true })
  platformFeePaise!: number;

  @Prop({ default: 0 })
  discountPaise!: number;

  @Prop({ required: true })
  totalPaise!: number;

  @Prop()
  promoCode?: string;

  @Prop()
  paymentMethodLabel?: string;

  @Prop()
  stripeCheckoutSessionId?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ConsultationBookingSchema = SchemaFactory.createForClass(ConsultationBookingDocument);

ConsultationBookingSchema.index({ clinicId: 1, scheduledAt: 1 });
ConsultationBookingSchema.index({ userId: 1, createdAt: -1 });
