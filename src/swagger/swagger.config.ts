import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export const SWAGGER_BEARER_AUTH = 'access-token';

export function buildSwaggerDocument(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Pademe API')
    .setDescription(
      'Backend API for Pademe. Auth uses Supabase (email/password). ' +
        'Step 1: `POST /auth/register`. Step 2: `POST /users` with Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token from POST /auth/register',
      },
      SWAGGER_BEARER_AUTH,
    )
    .addTag('Health', 'Service health checks')
    .addTag('Auth', 'Supabase authentication (email + password)')
    .addTag('Users', 'User profiles')
    .addTag('Storage', 'File storage (generic uploads)')
    .build();
}
