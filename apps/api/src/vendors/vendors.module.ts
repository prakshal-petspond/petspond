import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { PublicVendorsController } from './public-vendors.controller';

@Module({
  controllers: [PublicVendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
