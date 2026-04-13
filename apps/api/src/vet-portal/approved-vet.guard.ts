import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Vet } from '@petspond/types';

@Injectable()
export class ApprovedVetGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: Vet }>();
    const vet = req.user;
    if (!vet) throw new UnauthorizedException();
    if (vet.approvalStatus !== 'approved' || !vet.onboardingCompleted) {
      throw new UnauthorizedException('Complete onboarding and wait for approval');
    }
    return true;
  }
}
