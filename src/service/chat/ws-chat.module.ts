import { Module } from "@nestjs/common";
import { WsChatGateway } from "./ws-chat.gateway";
import { ChatController } from "./ws-chat.controller";
import { SocialNetworkModule } from "../social_network/social_network.module";
import { WsJwtGuard } from "src/security/guard/ws-jwt.guard";
import { JwtAuthGuard } from "src/security/JWT/jwt-auth.guard";
import { RolesGuard } from "src/security/guard/role.guard";
import { JwtStrategy } from "src/security/JWT/jwt.strategy";
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { forwardRef } from "@nestjs/common";

@Module({
    imports: [forwardRef(() => SocialNetworkModule), AuthModule],
    controllers: [ChatController],
    providers: [WsChatGateway, WsJwtGuard, JwtAuthGuard,JwtStrategy, RolesGuard, JwtService],
    exports: [WsChatGateway]
})
export class WsChatModule{};