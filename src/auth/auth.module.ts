import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME } from 'proto/auth.pb';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from 'src/JWT/jwt.strategy';
import { RolesGuard } from 'src/guard/role.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/auth.proto'),
          url: "localhost:50051"
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,RolesGuard]
})
export class AuthModule {}
