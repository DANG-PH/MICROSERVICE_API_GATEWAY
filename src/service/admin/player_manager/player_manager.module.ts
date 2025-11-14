import { Module } from '@nestjs/common';
import { PlayerManagerController } from './player_manager.controller'
import { JwtStrategy } from 'src/security/JWT/jwt.strategy';
import { RolesGuard } from 'src/security/guard/role.guard';

@Module({
  imports: [],
  controllers: [PlayerManagerController],
  providers: [JwtStrategy,RolesGuard]
})
export class PlayerManagerModule {}
