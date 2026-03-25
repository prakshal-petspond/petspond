import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Vet } from '@petspond/types';

export const CurrentVet = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Vet => {
    const request = ctx.switchToHttp().getRequest<{ user: Vet }>();
    return request.user;
  },
);
