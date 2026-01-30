import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
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
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Handle Prisma known request errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const code = exception.code;
      let status = HttpStatus.BAD_REQUEST;
      let message = exception.message;

      if (code === 'P2002') {
        status = HttpStatus.CONFLICT; // Unique constraint failed
        message = 'Unique constraint failed';
      } else if (code === 'P2025') {
        status = HttpStatus.NOT_FOUND; // Record to update/delete not found
        message = 'Record not found';
      }

      return res
        .status(status)
        .json({ statusCode: status, error: message, path: req.url });
    }

    // Validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: exception.message,
        path: req.url,
      });
    }

    // Initialization / unknown errors
    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Database error',
        path: req.url,
      });
    }

    // Fallback: rethrow so other filters/handlers can manage it
    throw exception;
  }
}
