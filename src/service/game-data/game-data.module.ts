import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GAME_DATA_PACKAGE_NAME } from 'proto/game-data.pb';
import { JwtStrategy } from 'src/security/JWT/jwt.strategy';
import { RolesGuard } from 'src/security/guard/role.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: GAME_DATA_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: GAME_DATA_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/game-data.proto'),
          url: process.env.ITEM_URL,
          loader: {
                keepCase: true,
                objects: true,
                arrays: true,
          },
        },
      },
    ]),
  ],
  controllers: [],
  providers: [JwtStrategy,RolesGuard],
  exports: []
})
export class GameDataModule {}
