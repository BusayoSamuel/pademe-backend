export default function configuration() {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    appName: process.env.APP_NAME ?? 'pademe-backend',
    supabase: {
      url: process.env.SUPABASE_URL ?? '',
      anonKey: process.env.SUPABASE_ANON_KEY ?? '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
      ssl: process.env.DATABASE_SSL !== 'false',
    },
    storage: {
      defaultBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'uploads',
    },
    cors: {
      origins: process.env.CORS_ORIGINS ?? '',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      connectReturnUrl: process.env.STRIPE_CONNECT_RETURN_URL ?? '',
      connectRefreshUrl: process.env.STRIPE_CONNECT_REFRESH_URL ?? '',
      connectAppReturnUrl:
        process.env.STRIPE_CONNECT_APP_RETURN_URL ??
        'padememobile://stripe-onboarding?return=complete',
      connectAppRefreshUrl:
        process.env.STRIPE_CONNECT_APP_REFRESH_URL ??
        'padememobile://stripe-onboarding?return=refresh',
    },
  };
}
