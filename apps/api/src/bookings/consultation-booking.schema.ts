import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class ConsultationBookingDocument extends Document {
  @Prop({ index: true })
  userId?: string;

  @Prop({ required: true, index: true })
  clinicId!: string;

  @Prop({ required: true })
  vetId!: string;

  @Prop()
  petId?: string;

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

  @Prop({ required: true, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' })
  paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';

  @Prop({
    enum: ['expected', 'waiting', 'in_consultation', 'ready_checkout'],
    default: 'expected',
  })
  queueStatus!: 'expected' | 'waiting' | 'in_consultation' | 'ready_checkout';

  @Prop({ default: false })
  isWalkIn!: boolean;

  @Prop()
  ownerNameSnapshot?: string;

  @Prop()
  ownerMobileSnapshot?: string;

  @Prop()
  checkedInAt?: Date;

  @Prop()
  consultationStartedAt?: Date;

  @Prop()
  checkoutReadyAt?: Date;

  @Prop()
  roomLabel?: string;

  @Prop()
  invoiceNumber?: string;

  @Prop()
  collectedAt?: Date;

  @Prop()
  collectedByVetId?: string;

  @Prop()
  refundedAt?: Date;

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
