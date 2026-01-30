import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameController } from './game.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { GameService } from './game.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [GameController],
  providers: [AppService, PrismaService, GameService],
})
export class AppModule {}
