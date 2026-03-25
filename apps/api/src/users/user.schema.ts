import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class UserDocument extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  mobile!: string;

  @Prop()
  email?: string;

  @Prop()
  city?: string;

  @Prop()
  pincode?: string;

  @Prop()
  referredBy?: string;

  @Prop({ default: false })
  onboardingCompleted!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.index({ mobile: 1 }, { unique: true });
