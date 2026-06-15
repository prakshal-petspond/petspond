import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: true })
export class VetRefreshTokenDocument extends Document {
  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true, index: true })
  vetId!: string;

  @Prop({ required: true, index: true })
  familyId!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  revokedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const VetRefreshTokenSchema = SchemaFactory.createForClass(VetRefreshTokenDocument);

VetRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
