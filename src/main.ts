import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet'; 
import { LoggingInterceptor } from './interceptor/logger.interceptors';
import { OnlineInterceptor } from './interceptor/online.interceptor';
import { JaegerInterceptor } from './interceptor/tracing.interceptors';
import { jaegerTracer } from 'jaeger';
import { TemporaryBanInterceptor } from './interceptor/temporary-ban.interceptors';
import { bold, green, cyan } from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật Helmet bảo mật header HTTP
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true, // cấu hình mặc định CSP
        directives: { // Custom lại các rule (tránh chặn hình ảnh).
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https:", "http:"],
        },
      },
    }),
  );

  // Bật CORS cho phép frontend gọi API
  app.enableCors({
    origin: [process.env.WEB_USER_URL,process.env.WEB_ADMIN_URL,process.env.API_GATEWAY_URL], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // interceptor logging
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    app.get(OnlineInterceptor),
    app.get(JaegerInterceptor),
    app.get(TemporaryBanInterceptor)
  );

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle(String(process.env.TITTLE_SWAGGER))
    .setDescription(String(process.env.CONTENT_SWAGGER))
    .setVersion(String(process.env.VERSION_SWAGGER))
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(String(process.env.ENDPOINT_SWAGGER), app, document);


  // Bật validation cho tất cả request body/query/params
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // loại bỏ các field không có trong DTO
    forbidNonWhitelisted: true, // báo lỗi nếu gửi field lạ
    transform: true, // tự chuyển kiểu dữ liệu nếu cần
  }));

  app.use((req, res, next) => {
    if (req.headers[String(process.env.HEADER_POST_PATCH)]) {
      req.method = req.headers[String(process.env.HEADER_POST_PATCH)]; // POST → PATCH cho game dùng
    }
    next();
  });

  await app.listen(Number(process.env.PORT));
  console.log(bold(green(`🚀 Server Dashboard: http://${process.env.SERVER_DASHBOARD_URL}`)));
}
bootstrap();


// Client -> POST /use-ngoc-nap
//        │
//        ▼
// [Express Layer]
//        │  <-- override req.method = PATCH
//        ▼
// [Nest Middleware] <-- chưa map route, chỉ có Logger, RateLimit...
//        ▼
// [Nest Route Mapping] <-- thấy PATCH → chọn @Patch()
//        ▼
// [Controller -> Service]
//        ▼
// Client nhận Response


//

// >>> Request in >>>

// [ Express middleware @ main.ts ]
//         ↓
// [ Nest Router Handler ]   <— ROUTE MATCH HAPPENS HERE, ở tầng express layer
//         ↓
// [ Nest middleware ]
//         ↓
// [ Guards ]
//         ↓
// [ Interceptors (before) ]
//         ↓
// [ Controller Handler ]
//         ↓
// [ Interceptors (after) ]
//         ↓
// [ Filters ]
//         ↓
// <<< Response out <<<