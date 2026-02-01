import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HmacService } from './auth/hmac.service';
import { PrismaService } from './prisma.service';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';
import { StoryService } from './story/story.service';
import { SuggestionService } from './suggestion/suggestion.service';
import { SuggestionController } from './suggestion/suggestion.controller';
import { NameService } from './name/name.service';
import { GameAuthGuard } from './auth/game-auth.guard';
import { PlayerAuthGuard } from './auth/player-auth.guard';
import { WebsocketAuthGuard } from './auth/websocket-auth.guard';
import { EventGateway } from './event/event.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [GameController, SuggestionController],
  providers: [
    PrismaService,
    HmacService,
    GameService,
    StoryService,
    NameService,
    SuggestionService,
    GameAuthGuard,
    PlayerAuthGuard,
    WebsocketAuthGuard,
    EventGateway,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
