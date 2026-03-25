import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { User } from '@petspond/types';
import { UserDocument } from './user.schema';

function toUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    mobile: doc.mobile,
    email: doc.email,
    city: doc.city,
    pincode: doc.pincode,
    referredBy: doc.referredBy,
    onboardingCompleted: doc.onboardingCompleted,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserDocument.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByMobile(mobile: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ mobile }).exec();
    return doc ? toUser(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? toUser(doc) : null;
  }

  async createOrFindByMobile(mobile: string): Promise<User> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    let doc = await this.userModel.findOne({ mobile: normalized }).exec();
    if (!doc) {
      doc = await this.userModel.create({
        name: 'User',
        mobile: normalized,
        onboardingCompleted: false,
      });
    }
    return toUser(doc);
  }

  async updateOnboarding(
    userId: string,
    data: { name?: string; email?: string; city?: string; pincode?: string },
  ): Promise<User> {
    const doc = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            ...(data.name != null && { name: data.name }),
            ...(data.email != null && { email: data.email }),
            ...(data.city != null && { city: data.city }),
            ...(data.pincode != null && { pincode: data.pincode }),
            onboardingCompleted: true,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new Error('User not found');
    return toUser(doc);
  }
}
