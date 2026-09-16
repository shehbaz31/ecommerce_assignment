import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config/config';
import { AppError } from '../../errors/app-error';

export class UrbaneBoltClient {
  private token: string | null = null;
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.urbanebolt.baseUrl,
      timeout: config.urbanebolt.timeoutMs,
      httpsAgent: undefined,
    });

    axiosRetry(this.client as any, {
      retries: config.urbanebolt.retryCount,
      retryDelay: (retryCount) => retryCount * config.urbanebolt.retryDelayMs,
      retryCondition: (error) => {
        return error.response?.status === 429 || (error.response?.status ?? 0) >= 500;
      },
    });

    this.client.interceptors.request.use((request: InternalAxiosRequestConfig) => {
      if (this.token) {
        request.headers = {
          ...(request.headers ?? {}),
          Authorization: `Bearer ${this.token}`,
        } as any;
      }
      return request;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const requestConfig = error?.config;

        if (status === 401 && requestConfig && !requestConfig.__retriedAfterAuth) {
          this.token = null;
          try {
            await this.authenticate();
            requestConfig.__retriedAfterAuth = true;
            requestConfig.headers = {
              ...(requestConfig.headers ?? {}),
              Authorization: `Bearer ${this.token}`,
            };
            return this.client.request(requestConfig);
          } catch (authError) {
            throw new AppError('AUTH_FAILURE', 'Courier authentication failed', 401);
          }
        }

        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError('COURIER_API_ERROR', 'Courier API request failed', 502, [{
          message: 'Courier service call failed',
        }]);
      },
    );
  }

  async authenticate(): Promise<void> {
    const response = await this.client.post('/auth', {
      apiKey: config.urbanebolt.apiKey,
    });

    const token = response?.data?.token ?? response?.data?.accessToken ?? response?.data?.data?.token;
    if (!token) {
      throw new AppError('AUTH_FAILURE', 'Courier authentication failed', 401);
    }

    this.token = token;
  }

  getClient() {
    return this.client;
  }
}
