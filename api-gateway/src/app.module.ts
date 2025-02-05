import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
<<<<<<< HEAD
import { AuthModule } from './auth/auth.module';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { AccountsService } from './accounts/accounts.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsService } from './transactions/transactions.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionsModule } from './transactions/transactions.module';
import { PatternsService } from './patterns/patterns.service';
import { PatternsController } from './patterns/patterns.controller';
import { PatternsModule } from './patterns/patterns.module';
import { FingerprintsService } from './fingerprints/fingerprints.service';
import { FingerprintsController } from './fingerprints/fingerprints.controller';
import { FingerprintsModule } from './fingerprints/fingerprints.module';

@Module({
  imports: [AuthModule, UsersModule, AccountsModule, TransactionsModule, PatternsModule, FingerprintsModule],
  controllers: [AppController, UsersController, AccountsController, TransactionsController, PatternsController, FingerprintsController],
  providers: [AppService, UsersService, AccountsService, TransactionsService, PatternsService, FingerprintsService],
=======
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { AccountModule } from './account/account.module';

@Module({
  imports: [AccountModule],
  controllers: [AppController, AccountController],
  providers: [AppService, AccountService],
>>>>>>> f172acded509c085c9fad23525507d8d09cb30c0
})
export class AppModule {}
