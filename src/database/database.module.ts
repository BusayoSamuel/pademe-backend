import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url');
        if (!url) {
          throw new Error(
            'DATABASE_URL is required. Copy it from Supabase → Project Settings → Database.',
          );
        }

        return {
          type: 'postgres' as const,
          url,
          ssl: config.get<boolean>('database.ssl')
            ? { rejectUnauthorized: false }
            : false,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
