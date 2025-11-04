import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ItemModule } from './item/item.module';
import { DeTuModule } from './detu/detu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,           
      envFilePath: '.env',     
    }),
    AuthModule,
    UserModule,
    ItemModule,
    DeTuModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
