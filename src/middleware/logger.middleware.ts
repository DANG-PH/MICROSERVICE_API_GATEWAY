import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      this.logger.log(
        `${method} ${originalUrl} → ${statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}

// Middleware nằm ở ngoài cùng, nên rất phù hợp để:
// Ghi lại request method, url, body
// Phát hiện lỗi sớm
// Dễ debug khi dev