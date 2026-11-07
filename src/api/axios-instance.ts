import axios, { AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const AXIOS_INSTANCE = axios.create({
  baseURL: 'https://wnsfinal.onrender.com',
  withCredentials: true, // Permite receber e enviar o Cookie HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador de Requisição: Injeta o token salvo no celular (Bearer e Cookie)
AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('wns_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.Cookie = `accessToken=${token}`;
  }
  return config;
});

// Interceptador de Resposta: Captura o token do Set-Cookie no /auth/login
AXIOS_INSTANCE.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const match = cookieString.match(/accessToken=([^;]+)/);
      if (match && match[1]) {
        await SecureStore.setItemAsync('wns_access_token', match[1]);
      }
    }
    return response;
  },
  (error) => {
    // Tratamento amigável para o Rate Limit (429) do RateLimitingService.java
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Muitas requisições. Aguarde 1 minuto e tente novamente.'));
    }
    return Promise.reject(error);
  }
);

// Função exigida pelo Orval para conectar os hooks do React Query ao nosso Axios
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query foi cancelada');
  };

  return promise;
};