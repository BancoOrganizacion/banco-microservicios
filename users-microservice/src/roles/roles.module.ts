import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role, RoleSchema } from 'shared-models';

@Global() // Hacer que el módulo sea global
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema }
    ])
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService]
})
export class RolesModule {}