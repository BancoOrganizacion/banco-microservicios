import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FingerprintController } from './fingerprint/fingerprint.controller';
import { FingerprintService } from './fingerprint/fingerprint.service';
import { FingerprintModule } from './fingerprint/fingerprint.module';

@Module({
  imports: [FingerprintModule],
  controllers: [AppController, FingerprintController],
  providers: [AppService, FingerprintService],
})
export class AppModule {}
