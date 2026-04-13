import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class PetDocument extends Document {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['dog', 'cat', 'bird', 'other'] })
  species!: 'dog' | 'cat' | 'bird' | 'other';

  @Prop({ required: true })
  breed!: string;

  @Prop()
  dateOfBirth?: string;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: 'male' | 'female' | 'other';

  @Prop({ type: [String], default: [] })
  servicesNeeded!: string[];

  @Prop()
  weight?: number;

  @Prop()
  neutered?: boolean;

  @Prop()
  photoUrl?: string;

  @Prop()
  microchipId?: string;

  @Prop()
  medicalNotes?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PetSchema = SchemaFactory.createForClass(PetDocument);

PetSchema.index({ userId: 1, createdAt: -1 });
