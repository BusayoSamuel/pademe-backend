import './polyfills';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildSwaggerDocument } from './swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = buildSwaggerDocument();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  const appName = config.get<string>('appName', 'pademe-backend');

  await app.listen(port);
  console.log(`${appName} listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api`);
}
void bootstrap();
