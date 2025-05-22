import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatternModule } from './pattern/pattern.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin'),PatternModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
