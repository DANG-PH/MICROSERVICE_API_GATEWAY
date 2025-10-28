import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Cấu hình Swagger
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

  await app.listen(3000);
  console.log(`🚀 Server đang chạy tại: http://localhost:3000`);
  console.log(`📘 Swagger tại: http://localhost:3000/api-docs`);
}
bootstrap();
