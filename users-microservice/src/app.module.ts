import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';


@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin'),
    UsuariosModule,
    RolesModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}