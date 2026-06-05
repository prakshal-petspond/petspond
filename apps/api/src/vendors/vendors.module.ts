import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorDocument, VendorSchema } from './vendor.schema';
import { VendorsService } from './vendors.service';
import { PublicVendorsController } from './public-vendors.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: VendorDocument.name, schema: VendorSchema }])],
  controllers: [PublicVendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
