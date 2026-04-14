import { HttpException } from '@nestjs/common';
import { catchError, throwError } from 'rxjs';
import { status as grpcStatus } from '@grpc/grpc-js';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import { winstonLogger } from 'src/logger/logger.config'; 

// Parse lỗi gRPC sang Http
export function grpcToHttp(code: number | null) {
  switch (code) {
    case grpcStatus.OK:                  return 200;  // 0
    case grpcStatus.INVALID_ARGUMENT:    return 400;  // 3 - dữ liệu đầu vào sai
    case grpcStatus.NOT_FOUND:           return 404;  // 5 - không tìm thấy
    case grpcStatus.ALREADY_EXISTS:      return 409;  // 6 - đã tồn tại
    case grpcStatus.PERMISSION_DENIED:   return 403;  // 7 - không có quyền
    case grpcStatus.RESOURCE_EXHAUSTED:  return 429;  // 8 - rate limit
    case grpcStatus.FAILED_PRECONDITION: return 400;  // 9 - điều kiện không thỏa (số dư không đủ,...)
    case grpcStatus.UNAUTHENTICATED:     return 401;  // 16 - chưa xác thực
    case grpcStatus.CANCELLED:           return 400;  // 1 - request bị cancel (tự bán acc chính mình,...)
    default:                             return 500;
  }
}

export function parseGrpcError(err: any) {
  if (err?.code !== undefined && err?.details) {
    return { code: err.code, message: err.details };
  }
}

export async function grpcCall<T>(
  serviceName = 'UnknownService',
  obs: Observable<T>,
  useLastValue = false,
  metadata?
): Promise<T> {
  const start = Date.now();

  const wrapped = obs.pipe(
    catchError(err => {
      const parsed = parseGrpcError(err);
      const httpStatus = grpcToHttp(parsed.code);
      const duration = Date.now() - start;

      const message = `🆘 Error → HTTP ${httpStatus}: ${parsed.message} (${duration}ms)`;
      if (httpStatus >= 500) {
        winstonLogger.error({ message, service: serviceName, admin: process.env.ADMIN_TEST });
      }
      return throwError(() => new HttpException(parsed.message, httpStatus));
    })
  );

  const result = await (useLastValue ? lastValueFrom(wrapped) : firstValueFrom(wrapped));
  
  const duration = Date.now() - start;
  if (duration > 0) {
    winstonLogger.warn({ 
      message: `⚠️ Slow gRPC call: ${duration}ms`, 
      service: serviceName 
    });
  }

  return result;
}