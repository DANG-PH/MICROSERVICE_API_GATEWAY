import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './service/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './service/user/user.module';
import { ItemModule } from './service/item/item.module';
import { DeTuModule } from './service/detu/detu.module';
import { PayModule } from './service/pay/pay/pay.module';
import { RedisModule } from './redis/redis.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { NestModule,MiddlewareConsumer } from '@nestjs/common';
import { RateLimitMiddleware } from './security/rate_limit/rate_limit.middleware';
import { CashierModule } from './service/admin/cashier/cashier.module';
import { EditorModule } from './service/admin/editor/editor.module';
import { FinanceModule } from './service/pay/finance/finance.module';
import { PartnerModule } from './service/admin/partner/partner.module';
import { PlayerManagerModule } from './service/admin/player_manager/player_manager.module';
import { LoggingInterceptor } from './interceptor/logger.interceptors';
import { OnlineInterceptor } from './interceptor/online.interceptor';
import { AdminModule } from './service/admin/admin/admin.module';
import { JaegerInterceptor } from './interceptor/tracing.interceptors';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,           
      envFilePath: '.env',     
    }),
    AuthModule,
    UserModule,
    ItemModule,
    DeTuModule,
    RedisModule,
    PayModule,
    AdminModule,
    PlayerManagerModule,
    CashierModule,
    FinanceModule,
    EditorModule,
    PartnerModule,
  ],
  controllers: [],
  providers: [OnlineInterceptor, LoggingInterceptor, JaegerInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}

// [1] Express/Fastify Layer (middleware thô: app.use()) 
//       ↓
// [2] Nest Global Middleware (class NestMiddleware)
//       ↓
// [3] Guards (CanActivate)
//       ↓
// [4] Interceptors (Before)
//       ↓
// [5] Pipes (Validation/Transform)
//       ↓
// [6] Controller → Service → Repository
//       ↓
// [7] Interceptors (After)
//       ↓
// [8] Exception Filters
//       ↓
// Client Response
