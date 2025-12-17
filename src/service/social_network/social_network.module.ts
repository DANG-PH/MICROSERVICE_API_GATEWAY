import { Module } from '@nestjs/common';
import { JwtStrategy } from 'src/security/JWT/jwt.strategy';
import { RolesGuard } from 'src/security/guard/role.guard';
import { AuthModule } from 'src/service/auth/auth.module';
import { SocialNetworkController } from './social_network.controller';

@Module({
  imports: [AuthModule],
  controllers: [SocialNetworkController],
  providers: [JwtStrategy,RolesGuard]
})
export class SocialNetworkModule {}
