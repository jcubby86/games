import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GameController } from './game.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { GameService } from './game.service';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HmacService } from './auth/hmac.service';
import { GameAuthGuard } from './auth/game-auth.guard';
import { PlayerAuthGuard } from './auth/player-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [GameController],
  providers: [
    AppService,
    PrismaService,
    GameService,
    HmacService,
    GameAuthGuard,
    PlayerAuthGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
