import { HttpException } from '@nestjs/common';
import { catchError, throwError } from 'rxjs';
import { status as grpcStatus } from '@grpc/grpc-js';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import { winstonLogger } from 'src/logger/logger.config'; 

export function grpcToHttp(code: number | null) {
  switch (code) {
    case grpcStatus.UNAUTHENTICATED: return 401;
    case grpcStatus.PERMISSION_DENIED: return 403;
    case grpcStatus.NOT_FOUND: return 404;
    case grpcStatus.ALREADY_EXISTS: return 409;
    case grpcStatus.RESOURCE_EXHAUSTED: return 429;
    default: return 500;
  }
}

export function parseGrpcError(err: any) {
  // log để debug raw error format
  console.error('⚠ gRPC Error:', err);

  // gRPC trả error ở nhiều format khác nhau → xử lý bao quát:
  if (err?.code !== undefined && err?.details) {
    return { code: err.code, message: err.details };
  }

  try {
    const parsed = JSON.parse(err.message);
    return { code: parsed.code ?? null, message: parsed.message ?? parsed };
  } catch {
    return { code: err.code ?? null, message: err.message ?? 'Unknown error' };
  }
}

export async function grpcCall<T>(serviceName = 'UnknownService',obs: Observable<T>, useLastValue = false, metadata?): Promise<T> {
  const wrapped = obs.pipe(
    catchError(err => {
      const parsed = parseGrpcError(err);
      const httpStatus = grpcToHttp(parsed.code);

      const message = `🆘 Error → HTTP ${httpStatus}: ${parsed.message}`;
      if (httpStatus >= 500) {
        winstonLogger.error({ message, service: serviceName, admin: process.env.ADMIN_TEST });
      }
      return throwError(() => new HttpException(parsed.message, httpStatus));
    })
  );

  return useLastValue ? lastValueFrom(wrapped) : firstValueFrom(wrapped);
}