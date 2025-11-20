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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật Helmet bảo mật header HTTP
  app.use(helmet());

  // Bật CORS cho phép frontend gọi API
  app.enableCors({
    origin: ['http://localhost:3107','http://localhost:3000','http://localhost:3108'], 
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
    .setTitle('API Gateway')
    .setDescription('Tài liệu API tổng hợp của hệ thống backend NRO')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);


  // Bật validation cho tất cả request body/query/params
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // loại bỏ các field không có trong DTO
    forbidNonWhitelisted: true, // báo lỗi nếu gửi field lạ
    transform: true, // tự chuyển kiểu dữ liệu nếu cần
  }));

  app.use((req, res, next) => {
    if (req.headers['x-http-method-override']) {
      req.method = req.headers['x-http-method-override']; // POST → PATCH cho game dùng
    }
    next();
  });

  await app.listen(3000);
  console.log(`🚀 Server đang chạy tại: http://localhost:3000`);
  console.log(`📘 Swagger tại: http://localhost:3000/api-docs`);
  console.log(`📘 Jeager tracing tại: http://localhost:16686`);
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
