import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/petspond', {
      retryWrites: true,
    }),
    HealthModule,
    // Feature modules to add: AuthModule, UsersModule, VetsModule, PetsModule, AppointmentsModule, RecordsModule, BillingModule
  ],
})
export class AppModule {}
