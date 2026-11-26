import { Module } from '@nestjs/common';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import { AuthController } from './auth.controller';
import { GuestSessionService } from './guest-session.service';
import { StaffAuthService } from './staff-auth.service';
import { StaffSessionService } from './staff-session.service';

@Module({
  controllers: [AuthController],
  providers: [
    EndpointRateLimitGuard,
    GuestSessionService,
    StaffAuthService,
    StaffSessionService,
  ],
  exports: [GuestSessionService, StaffSessionService],
})
export class AuthModule {}
