import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HmacService } from './auth/hmac.service';
import { GameAuthGuard } from './auth/game-auth.guard';
import { PlayerAuthGuard } from './auth/player-auth.guard';
import { PrismaService } from './prisma.service';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';
import { StoryService } from './story/story.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [GameController],
  providers: [
    PrismaService,
    GameService,
    HmacService,
    GameAuthGuard,
    PlayerAuthGuard,
    StoryService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
