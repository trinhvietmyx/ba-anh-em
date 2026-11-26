import { Module } from '@nestjs/common';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import { AuthModule } from '../auth/auth.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [AuthModule],
  controllers: [MenuController],
  providers: [MenuService, EndpointRateLimitGuard],
  exports: [MenuService],
})
export class MenuModule {}
