import { Module } from "@nestjs/common";
import { SocialNetworkModule } from "../social_network/social_network.module";
import { WsJwtGuard } from "src/security/guard/ws-jwt.guard";
import { JwtAuthGuard } from "src/security/JWT/jwt-auth.guard";
import { RolesGuard } from "src/security/guard/role.guard";
import { JwtStrategy } from "src/security/JWT/jwt.strategy";
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { WsGateway } from "./ws.gateway";

@Module({
    imports: [
        UserModule
    ],
    controllers: [],
    providers: [WsGateway, WsJwtGuard, JwtAuthGuard,JwtStrategy, RolesGuard, JwtService],
    exports: [WsGateway]
})
export class WsModule{};