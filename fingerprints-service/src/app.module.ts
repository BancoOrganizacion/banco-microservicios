import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FingerprintModule } from './fingerprint/fingerprint.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin',
    ),
    FingerprintModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
