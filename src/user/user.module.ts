import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { USER_PACKAGE_NAME } from 'proto/user.pb';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from 'src/JWT/jwt.strategy';
import { RolesGuard } from 'src/guard/role.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: USER_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/user.proto'),
          url: "localhost:50052",
          loader: {
                keepCase: true,
                objects: true,
                arrays: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService,JwtStrategy,RolesGuard],
  exports: [UserService]
})
export class UserModule {}
