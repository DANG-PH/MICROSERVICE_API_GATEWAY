import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

@Controller('server')
@ApiTags('Api Server')
export class ServerController {
  constructor() {}

  @Get('health')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Xem tình trạng gateway của server' })
  @Header('Content-Type', 'text/html')
  healthCheck() {
    const status = 'OK';
    const timestamp = new Date(Date.now()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Health Check</title>
        <link rel="icon" type="image/png" href="https://avatarfiles.alphacoders.com/110/110487.png">
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
            -webkit-backdrop-filter: blur(10px);

            padding: 30px 40px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);

            box-shadow: 0 8px 30px rgba(0,0,0,0.5);

            text-align: center;
            max-width: 420px;
            color: #fff;
          }
          h1 {
            color: #f1f1f1;
          }
          h1 .ok {
            color: #57ff80;
            font-weight: bold;
          }
          p {
            color: #e5e5e5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Health Status: <span class="ok">${status}</span></h1>
          <p>Thời gian kiểm tra: ${timestamp}</p>
        </div>
      </body>
      </html>
    `;
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
            <a href="http://${process.env.HOST}:${process.env.PORT}" target="_blank">Xem chi tiết</a>
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
            <img src="https://img.icons8.com/ios-filled/100/000000/leaf.png"/>
            <h3>Mongo Express</h3>
            <p>Quản lí database MongoDB.</p>
            <a href="http://${process.env.MONGO_MANAGER_URL}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/heart-with-pulse.png"/>
            <h3>Health Check</h3>
            <p>Xem trạng thái server.</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/server/health" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/document.png"/>
            <h3>Logging Winston</h3>
            <p>Xem log của server.</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/server/log" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/000000/console.png"/>
            <h3>System Manager</h3>
            <p>Xem bộ nhớ, CPU, ... của server</p>
            <a href="http://${process.env.HOST}:${process.env.PORT}/server/memory" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/web.png"/>
            <h3>Frontend User</h3>
            <p>Trang web cho User.</p>
            <a href="http://${process.env.WEB_USER_URL}" target="_blank">Xem chi tiết</a>
          </div>

          <div class="card">
            <img src="https://img.icons8.com/ios-filled/100/user-shield.png"/>
            <h3>Frontend Admin</h3>
            <p>Trang web cho Admin.</p>
            <a href="http://${process.env.WEB_ADMIN_URL}" target="_blank">Xem chi tiết</a>
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

  @Get('log')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'logging' })
  @Header('Content-Type', 'text/html')
  async log(): Promise<string> {
  const mongoUrl = String(process.env.MONGODB_URL);
  const client = new MongoClient(mongoUrl);

  let logs: any[] = [];

  try {
    await client.connect();
    const db = client.db();           // lấy database từ URL
    const collection = db.collection('logs'); // cau hinh ben logger winston.transports.MongoDB

    // Lấy 100 log mới nhất
    logs = await collection
      .find({})
      .sort({ timestamp: -1 })   // Mới nhất trước
      .limit(100)
      .toArray();
  } catch (err: any) {
    logs = [{ message: 'Cannot read MongoDB logs: ' + err.message, level: 'error' }];
  } finally {
    await client.close();
  }

  // Chuyển logs thành HTML rows
  const logRows = logs.map(log => {
    const ts = log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '';
    const lvl = log.level || '';
    const ctx = log.service || log.context || '';
    const msg = log.message || '';
    const admin = log.admin || '';

    let statusColor = '#e5e5e5';
    let statusBg = 'rgba(229, 229, 229, 0.1)';
    if (lvl.toLowerCase() === 'info') {
      statusColor = '#57ff80';
      statusBg = 'rgba(87, 255, 128, 0.1)';
    } else if (lvl.toLowerCase() === 'warn') {
      statusColor = '#ffd93d';
      statusBg = 'rgba(255, 217, 61, 0.1)';
    } else if (lvl.toLowerCase() === 'error') {
      statusColor = '#ff6b6b';
      statusBg = 'rgba(255, 107, 107, 0.1)';
    }

    return `
      <tr>
        <td class="time-col">${ts}</td>
        <td class="status-col">
          <span class="status-badge" style="color:${statusColor}; background:${statusBg}; border-color:${statusColor}">
            ${lvl.toUpperCase()}
          </span>
        </td>
        <td class="service-col">${ctx}</td>
        <td class="message-col">${msg}</td>
        <td class="admin-col">${admin}</td>
      </tr>
    `;
  }).join('');
    // cách đọc từ file logs
    // const logPath = path.join(process.cwd(), 'logs', 'combined.log');

    // let logs: any[] = [];
    // try {
    //   const data = fs.readFileSync(logPath, 'utf-8');
    //   const lines = data.trim().split('\n');
    //   // Lấy 100 dòng cuối, hiển thị ngược lại (mới nhất lên đầu)
    //   logs = lines.slice(-100).reverse().map(line => {
    //     try {
    //       return JSON.parse(line);
    //     } catch (e) {
    //       return { message: line, level: 'error' }; // log lỗi parse
    //     }
    //   });
    // } catch (err) {
    //   logs = [{ message: 'Cannot read log file: ' + err.message, level: 'error' }];
    // }

    // const logRows = logs.map(log => {
    //   const ts = log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '';
    //   const lvl = log.level || '';
    //   const ctx = log.service || log.context || ''; // Ưu tiên service trước
    //   const msg = log.message || '';
    //   const admin = log.admin || ''; // Lấy admin

    //   // màu theo level
    //   let statusColor = '#e5e5e5';
    //   let statusBg = 'rgba(229, 229, 229, 0.1)';
    //   if (lvl.toLowerCase() === 'info') {
    //     statusColor = '#57ff80';
    //     statusBg = 'rgba(87, 255, 128, 0.1)';
    //   } else if (lvl.toLowerCase() === 'warn') {
    //     statusColor = '#ffd93d';
    //     statusBg = 'rgba(255, 217, 61, 0.1)';
    //   } else if (lvl.toLowerCase() === 'error') {
    //     statusColor = '#ff6b6b';
    //     statusBg = 'rgba(255, 107, 107, 0.1)';
    //   }

    //   return `
    //     <tr>
    //       <td class="time-col">${ts}</td>
    //       <td class="status-col">
    //         <span class="status-badge" style="color:${statusColor}; background:${statusBg}; border-color:${statusColor}">
    //           ${lvl.toUpperCase()}
    //         </span>
    //       </td>
    //       <td class="service-col">${ctx}</td>
    //       <td class="message-col">${msg}</td>
    //       <td class="admin-col">${admin}</td>
    //     </tr>
    //   `;
    // }).join('');

    return `
      <html>
      <head>
        <title>Log Server</title>
        <link rel="icon" type="image/png" href="https://avatarfiles.alphacoders.com/110/110487.png">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: url('https://i.pinimg.com/originals/fd/ea/ff/fdeaff0efe3b9f014f0be734224a5219.png') no-repeat center center;
            background-size: cover;
            padding: 20px;
          }
          .container {
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 32px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            max-width: 1600px;
            width: 100%;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
          }
          h1 {
            color: #ffffff;
            text-align: center;
            margin-bottom: 24px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .table-wrapper {
            overflow-y: auto;
            overflow-x: auto;
            flex: 1;
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.25);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            color: #fff;
          }
          thead {
            position: sticky;
            top: 0;
            z-index: 10;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
          }
          th {
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a0a0b0;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          }
          td {
            padding: 14px 20px;
            font-size: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            vertical-align: top;
          }
          tr:hover {
            background: rgba(255, 255, 255, 0.03);
          }
          .time-col {
            color: #b0b0c0;
            font-size: 14px;
            white-space: nowrap;
            min-width: 160px;
            font-variant-numeric: tabular-nums;
          }
          .status-col {
            min-width: 100px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.3px;
            border: 1.5px solid;
            text-align: center;
          }
          .service-col {
            color: #90caf9;
            font-weight: 500;
            min-width: 150px;
          }
          .message-col {
            color: #e5e5e5;
            word-break: break-word;
            line-height: 1.5;
          }
          .admin-col {
            color: #ffa726;
            font-weight: 500;
            min-width: 120px;
          }
          /* Scrollbar styling */
          .table-wrapper::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .table-wrapper::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          .table-wrapper::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          @media (max-width: 768px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 22px;
            }
            th, td {
              padding: 10px 12px;
              font-size: 13px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Logging Server ( 100 logs )</h1>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Service</th>
                  <th>Message</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                ${logRows}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  @Get('memory')
  @Header('Content-Type', 'text/html')
  memory() {
    const cpuUsage = (process.cpuUsage().user / 1000000).toFixed(2);
    const memUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const heapUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const timestamp = new Date().toLocaleString('vi-VN');

    return `
      <html>
      <head>
        <title>System Monitor</title>
        <link rel="icon" type="image/png" href="https://avatarfiles.alphacoders.com/110/110487.png">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: url('https://i.pinimg.com/originals/fd/ea/ff/fdeaff0efe3b9f014f0be734224a5219.png') no-repeat center center;
            background-size: cover;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            max-width: 500px;
            width: 100%;
          }
          h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #ffffff;
          }
          .card { 
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            margin: 15px 0;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          h2 { 
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a0a0b0;
          }
          .bar-container {
            background: rgba(0, 0, 0, 0.4);
            height: 24px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          .bar { 
            height: 100%;
            border-radius: 12px;
            transition: width 0.3s ease;
            background: linear-gradient(90deg, #57ff80 0%, #43a047 100%);
          }
          .value {
            font-size: 20px;
            font-weight: 600;
            color: #57ff80;
          }
          .timestamp {
            text-align: center;
            margin-top: 25px;
            font-size: 14px;
            color: #b0b0c0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>System Monitor</h1>
          
          <div class="card">
            <h2>CPU Usage</h2>
            <div class="bar-container">
              <div class="bar" style="width:${Math.min(parseFloat(cpuUsage), 100)}%"></div>
            </div>
            <p class="value">${cpuUsage}%</p>
          </div>

          <div class="card">
            <h2>Memory Usage</h2>
            <div class="bar-container">
              <div class="bar" style="width:${Math.min((parseFloat(memUsage) / 1024) * 100, 100)}%"></div>
            </div>
            <p class="value">${memUsage} MB</p>
          </div>

          <div class="card">
            <h2>Heap Usage</h2>
            <div class="bar-container">
              <div class="bar" style="width:${Math.min((parseFloat(heapUsage) / 1024) * 100, 100)}%"></div>
            </div>
            <p class="value">${heapUsage} MB</p>
          </div>

          <p class="timestamp">Last updated: ${timestamp}</p>
        </div>
      </body>
      </html>
    `;
  }
}
