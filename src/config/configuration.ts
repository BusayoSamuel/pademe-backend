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
  };
}
