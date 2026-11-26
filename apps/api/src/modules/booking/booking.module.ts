import { Module } from '@nestjs/common';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityService } from './availability.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AuthModule],
  controllers: [BookingController],
  providers: [AvailabilityService, BookingService, EndpointRateLimitGuard],
})
export class BookingModule {}
