import { Module, type DynamicModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { MenuModule } from './modules/menu/menu.module';
import type { RuntimeConfig } from './platform/config/runtime-config';
import { HealthController } from './platform/health/health.controller';
import { PlatformModule } from './platform/platform.module';

@Module({
  controllers: [HealthController],
})
export class AppModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        PlatformModule.register(config),
        AuthModule,
        MenuModule,
        BookingModule,
      ],
    };
  }
}
