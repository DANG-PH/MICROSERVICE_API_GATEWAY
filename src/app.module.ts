import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './service/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './service/user/user.module';
import { ItemModule } from './service/item/item.module';
import { DeTuModule } from './service/detu/detu.module';
import { PayModule } from './service/pay/pay.module';
import { RedisModule } from './redis/redis.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { NestModule,MiddlewareConsumer } from '@nestjs/common';
import { RateLimitMiddleware } from './security/rate_limit/rate_limit.middleware';

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
    PayModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
