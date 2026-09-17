import dotenv from 'dotenv';

dotenv.config();

const normalizeBaseUrl = (value: string) => {
  if (!value) {
    return 'https://uat.urbanebolt.example.com/api';
  }
  return value.startsWith('http://') ? value.replace('http://', 'https://') : value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? '3000'),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/easecommerce?schema=public',
  urbanebolt: {
    baseUrl: normalizeBaseUrl(process.env.URBANEBOLT_BASE_URL ?? 'https://uat.urbanebolt.example.com/api'),
    username: process.env.URBANEBOLT_USERNAME ?? '',
    password: process.env.URBANEBOLT_PASSWORD ?? '',
    customerCode: process.env.URBANEBOLT_CUSTOMER_CODE ?? '',
    timeoutMs: Number(process.env.URBANEBOLT_TIMEOUT_MS ?? '10000'),
    retryCount: Number(process.env.URBANEBOLT_RETRY_COUNT ?? '3'),
    retryDelayMs: Number(process.env.URBANEBOLT_RETRY_DELAY_MS ?? '500'),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
