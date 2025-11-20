import { Module } from '@nestjs/common';
import { PlayerManagerController } from './player_manager.controller'
import { JwtStrategy } from 'src/security/JWT/jwt.strategy';
import { RolesGuard } from 'src/security/guard/role.guard';
import { AuthModule } from 'src/service/auth/auth.module';
import { UserModule } from 'src/service/user/user.module';
import { ItemModule } from 'src/service/item/item.module';
import { DeTuModule } from 'src/service/detu/detu.module';
import { PayModule } from 'src/service/pay/pay/pay.module';

@Module({
  imports: [AuthModule, UserModule, ItemModule, DeTuModule, PayModule],
  controllers: [PlayerManagerController],
  providers: [JwtStrategy,RolesGuard]
})
export class PlayerManagerModule {}
