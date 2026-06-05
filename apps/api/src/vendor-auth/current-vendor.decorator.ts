import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Vendor } from '@petspond/types';

export const CurrentVendor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Vendor => {
  const request = ctx.switchToHttp().getRequest<{ user: Vendor }>();
  return request.user;
});
