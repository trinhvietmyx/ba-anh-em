import { Global, Module, type DynamicModule } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from './config/runtime-config';
import { DatabaseService } from './db/database.service';

@Global()
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class PlatformModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: PlatformModule,
      providers: [{ provide: RUNTIME_CONFIG, useValue: config }],
      exports: [RUNTIME_CONFIG],
    };
  }
}
