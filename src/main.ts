import './polyfills';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  const appName = config.get<string>('appName', 'pademe-backend');

  await app.listen(port);
  console.log(`${appName} listening on http://localhost:${port}`);
}
void bootstrap();
