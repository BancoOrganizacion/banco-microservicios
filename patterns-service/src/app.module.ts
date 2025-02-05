import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatternController } from './pattern/pattern.controller';
import { PatternService } from './pattern/pattern.service';
import { PatternModule } from './pattern/pattern.module';

@Module({
  imports: [PatternModule],
  controllers: [AppController, PatternController],
  providers: [AppService, PatternService],
})
export class AppModule {}
