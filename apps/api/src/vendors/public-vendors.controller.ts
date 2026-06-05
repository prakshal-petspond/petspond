import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { VendorServiceType } from '@petspond/types';
import { VendorsService } from './vendors.service';

@Controller('public/vendors')
export class PublicVendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  list(
    @Query('type') type?: VendorServiceType,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('q') q?: string,
  ) {
    return this.vendors.listPublic({
      type,
      lat: lat != null ? parseFloat(lat) : undefined,
      lng: lng != null ? parseFloat(lng) : undefined,
      q,
    });
  }

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const d = await this.vendors.getPublicDetail(
      id,
      lat != null ? parseFloat(lat) : undefined,
      lng != null ? parseFloat(lng) : undefined,
    );
    if (!d) throw new NotFoundException('Vendor not found or outside service area');
    return d;
  }
}
