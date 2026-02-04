import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

const levels: LogLevel[] =
  process.env.NODE_ENV === 'development'
    ? ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']
    : ['log', 'warn', 'error', 'fatal'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: levels });

  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
