import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { Prisma } from '../generated/prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Handle Prisma known request errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaCode = exception.code;
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let error = 'Internal Server Error';
      let message = exception.message;

      if (prismaCode === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'Unique constraint failed';
      } else if (prismaCode === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Record not found';
      }

      this.logger.error(`Prisma Error [${prismaCode}]: ${exception.message}`);

      return res.status(statusCode).json({
        statusCode,
        message,
        error,
        path: req.url,
        prismaCode,
      });
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      const prismaCode = exception.errorCode;

      this.logger.error(`Prisma Error [${prismaCode}]: ${exception.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: exception.message,
        path: req.url,
        prismaCode,
      });
    }

    if (
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      this.logger.error(
        `Prisma Error [${exception.name}]: ${exception.message}`,
      );

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: exception.message,
        path: req.url,
      });
    }

    // Fallback: rethrow so other filters/handlers can manage it
    throw exception;
  }
}

export function isPrismaUniqueError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}
