import { Module, type DynamicModule } from '@nestjs/common';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from './platform/config/runtime-config';
import { DatabaseService } from './platform/db/database.service';
import { HealthController } from './platform/health/health.controller';

@Module({
  controllers: [HealthController],
  providers: [DatabaseService],
})
export class AppModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: RUNTIME_CONFIG, useValue: config }],
    };
  }
}
