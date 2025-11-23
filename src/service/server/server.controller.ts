import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('server')
@ApiTags('Api Server')
export class ServerController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Xem tình trạng gateway của server' })
  getServerInfo() {
    return {
      status: 'Server running',
      url: `http://${process.env.HOST}:${process.env.PORT}`,
      timestamp: new Date(Date.now()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Xem tình trạng gateway của server' })
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date(Date.now()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    };
  }

  @Get('dashboard')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Hiển thị các service backend' })
  @Header('Content-Type', 'text/html') // đảm bảo browser hiểu HTML
  dashboard(): string {
    return `
      <html>
      <head>
        <title>Backend Dashboard</title>
        <link rel="icon" type="image/png" href="https://avatarfiles.alphacoders.com/110/110487.png">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            color: #111;
            margin: 0;
            padding: 0;
          }

          header {
            background-color: #000;
            color: #fff;
            padding: 25px;
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 1px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          header {
            background: linear-gradient(90deg, #000, #333);
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }

          main {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            padding: 40px;
            max-width: 1200px;
            margin: auto;
          }

          .card {
            background: #f9f9f9;
            border: 1px solid #ccc;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }

          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          }

          .card img {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
          }

          .card h3 {
            margin: 10px 0;
            font-size: 1.2rem;
          }

          .card p {
            font-size: 0.95rem;
            color: #555;
            margin-bottom: 15px;
          }

          .card a {
            display: inline-block;
            padding: 8px 15px;
            border: 1px solid #111;
            border-radius: 6px;
            text-decoration: none;
            color: #111;
            font-weight: 600;
            transition: background 0.2s, color 0.2s;
          }

          .card a:hover {
            background: #111;
            color: #fff;
          }

          footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
          }

          footer .social-icons {
            margin-top: 10px;
          }

          footer .social-icons a {
            display: inline-block;
            margin: 0 8px;
            transition: transform 0.2s, opacity 0.2s;
          }

          footer .social-icons a:hover {
            transform: scale(1.2);
            opacity: 0.8;
          }

          footer .social-icons img {
            width: 24px;
            height: 24px;
            vertical-align: middle;
          }

          @media (max-width: 600px) {
            main {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div>HDG STUDIO</div>
          <img style="width:60px" src="https://avatarfiles.alphacoders.com/110/110487.png">
        </header>
        <main>
          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/server.png"/>
            <h3>Server</h3>
            <p>Truy cập server backend chính.</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/server" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/api.png"/>

            <h3>Swagger</h3>
            <p>Xem tài liệu API của project.</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/${process.env.ENDPOINT_SWAGGER}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/monitor.png"/>
            <h3>Jaeger</h3>
            <p>Giám sát tracing cho server.</p>
            <a href="http://${process.env.HOST}:${process.env.JAEGER_PORT}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/mysql-logo.png"/>
            <h3>PHP Admin</h3>
            <p>Quản lý cơ sở dữ liệu MySQL.</p>
            <a href="http://${process.env.HOST}:${process.env.PHP_ADMIN_PORT}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/database.png"/>
            <h3>Adminer</h3>
            <p>Quản lý database linh hoạt.</p>
            <a href="http://${process.env.HOST}:${process.env.ADMINER_PORT}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/rabbit.png"/>
            <h3>RabbitMQ Admin</h3>
            <p>Quản lý hàng đợi RabbitMQ.</p>
            <a href="http://${process.env.HOST}:${process.env.RABBIT_ADMIN_PORT}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/redis.png"/>
            <h3>RedisInsight</h3>
            <p>Quản lý Redis và xem docs.</p>
            <a href="http://${process.env.HOST}:${process.env.REDISINSIGHT_PORT}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/heart-with-pulse.png"/>
            <h3>Health Check</h3>
            <p>Xem trạng thái server.</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/server/health" target="_blank">Xem chi tiết</a>
          </div>
        </main>
        <footer>
          Backend Dashboard - Hải Đăng © ${new Date().getFullYear()}
          <div class="social-icons">
            <a href="https://github.com/DANG-PH" target="_blank" title="GitHub">
              <img src="https://i.imgflip.com/7an9j1.png" alt="GitHub"/>
            </a>
            <a href="https://facebook.com/danghaipham" target="_blank" title="Facebook">
              <img src="https://cdn.pixabay.com/photo/2020/09/28/18/43/facebook-5610792_640.png" alt="Facebook"/>
            </a>
            <a href="https://linkedin.com/in/danghaipham" target="_blank" title="LinkedIn">
              <img src="https://cdn1.iconfinder.com/data/icons/logotypes/32/circle-linkedin-512.png" alt="LinkedIn"/>
            </a>
          </div>
        </footer>
      </body>
      </html>
      `;

  }
}
