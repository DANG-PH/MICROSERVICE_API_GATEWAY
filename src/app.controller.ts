import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';


@Controller()
@ApiTags('Api App')
export class AppController {
  constructor() {}

  @Get()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Xem tình trạng gateway của server' })
  getServerInfo() {
    const status = 'Server running';
    const url = `http://${process.env.HOST}:${process.env.PORT}`;
    const timestamp = new Date(Date.now()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Các ENV bổ sung
    const gateway = process.env.API_GATEWAY_URL;
    const webUser = process.env.WEB_USER_URL;
    const webAdmin = process.env.WEB_ADMIN_URL;

    const authURL = process.env.AUTH_URL;
    const userURL = process.env.USER_URL;
    const itemURL = process.env.ITEM_URL;
    const detuURL = process.env.DETU_URL;
    const payURL = process.env.PAY_URL;
    const adminURL = process.env.ADMIN_URL;

    const redis = process.env.REDIS_URL;
    const redisInsight = process.env.REDISINSIGHT_PORT;
    const jaegerHost = process.env.JAEGER_CONNECT_HOST;
    const jaegerPort = process.env.JAEGER_PORT;

    const namespaceCache = process.env.NAME_SPACE_CACHE_KEY;
    const rolesKey = process.env.ROLES_KEY;

    const env = process.env.NODE_ENV || 'development';
    const version = process.env.VERSION_SWAGGER || '1.0';
    const dashboardURL = process.env.SERVER_DASHBOARD_URL;

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <link rel="icon" type="image/png" href="https://avatarfiles.alphacoders.com/110/110487.png">
        <title>Server Info</title>
        <style>
          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: url('https://i.pinimg.com/originals/fd/ea/ff/fdeaff0efe3b9f014f0be734224a5219.png') no-repeat center center;
            background-size: cover;
          }

          .card {
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(10px);
            padding: 30px 40px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            color: #fff;
            width: 900px;
          }

          h1 {
            margin-bottom: 20px;
            font-size: 26px;
            text-align: center;
          }

          .status {
            color: #57ff80;
            font-weight: bold;
          }

          .row {
            display: flex;
            gap: 35px;
            margin-top: 10px;
          }

          .col {
            flex: 1;
            min-width: 0;
          }

          .section-title {
            margin: 10px 0 6px;
            font-size: 17px;
            color: #ffd585;
            border-bottom: 1px solid rgba(255,255,255,0.15);
            padding-bottom: 4px;
          }

          table {
            width: 100%;
            font-size: 15px;
            border-collapse: collapse;
          }

          td {
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          td:first-child {
            width: 38%;
            color: #ffd48a;
            font-weight: 600;
          }

          a {
            color: #80ffea;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <h1>Server Info: <span class="status">${status}</span></h1>

          <div class="row">
            <!-- LEFT COLUMN -->
            <div class="col">
              <div class="section-title">System</div>
              <table>
                <tr><td>URL</td><td><a href="${url}" target="_blank">${url}</a></td></tr>
                <tr><td>Environment</td><td>${env}</td></tr>
                <tr><td>Version</td><td>${version}</td></tr>
                <tr><td>Dashboard</td><td><a href="http://${dashboardURL}" target="_blank">${dashboardURL}</a></td></tr>
              </table>

              <div class="section-title">Frontend</div>
              <table>
                <tr><td>Gateway</td><td>${gateway}</td></tr>
                <tr><td>User Web</td><td>${webUser}</td></tr>
                <tr><td>Admin Web</td><td>${webAdmin}</td></tr>
              </table>

              <div class="section-title">Config</div>
              <table>
                <tr><td>Namespace</td><td>${namespaceCache}</td></tr>
                <tr><td>Roles Key</td><td>${rolesKey}</td></tr>
              </table>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="col">
              <div class="section-title">Microservices</div>
              <table>
                <tr><td>Auth</td><td>${authURL}</td></tr>
                <tr><td>User</td><td>${userURL}</td></tr>
                <tr><td>Item</td><td>${itemURL}</td></tr>
                <tr><td>Detu</td><td>${detuURL}</td></tr>
                <tr><td>Payment</td><td>${payURL}</td></tr>
                <tr><td>Admin</td><td>${adminURL}</td></tr>
              </table>

              <div class="section-title">Monitoring</div>
              <table>
                <tr><td>Redis</td><td>${redis}</td></tr>
                <tr><td>RedisInsight</td><td>${redisInsight}</td></tr>
                <tr><td>Jaeger Host</td><td>${jaegerHost}</td></tr>
                <tr><td>Jaeger Port</td><td>${jaegerPort}</td></tr>
              </table>

              <div class="section-title">Time</div>
              <table>
                <tr><td>Timestamp</td><td>${timestamp}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;
  }

}
