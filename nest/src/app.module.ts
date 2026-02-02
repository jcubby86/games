import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';

import { LoggerMiddleware } from './middleware/logger.middleware';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma.service';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';
import { StoryService } from './story/story.service';
import { SuggestionController } from './suggestion/suggestion.controller';
import { SuggestionService } from './suggestion/suggestion.service';
import { SuggestionRepository } from './suggestion/suggestion.repository';
import { NameService } from './name/name.service';
import { EventGateway } from './event/event.gateway';
import { suggestionProviderFactory } from './suggestion/suggestion.factory';
import { HttpModule } from '@nestjs/axios';
import { OpenAIService } from './openai/openai.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    EventEmitterModule.forRoot(),
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '60m' },
    }),
    HttpModule,
  ],
  controllers: [GameController, SuggestionController],
  providers: [
    PrismaService,
    AuthService,
    GameService,
    StoryService,
    NameService,
    SuggestionService,
    SuggestionRepository,
    suggestionProviderFactory,
    EventGateway,
    OpenAIService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
