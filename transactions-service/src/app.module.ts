import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionService } from './transaction/transaction.service';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [AppController, TransactionController],
  providers: [AppService, TransactionService],
})
export class AppModule {}
