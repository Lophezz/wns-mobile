import axios, { AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const AXIOS_INSTANCE = axios.create({
  baseURL: 'https://wnsfinal.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para ler o Token na Web ou no Mobile
const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('wns_access_token');
  return await SecureStore.getItemAsync('wns_access_token');
};

const setToken = async (token: string) => {
  if (Platform.OS === 'web') localStorage.setItem('wns_access_token', token);
  else await SecureStore.setItemAsync('wns_access_token', token);
};

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.Cookie = `accessToken=${token}`;
    }
  } catch (error) {
    // Ignora erro de storage e segue com a requisição
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const match = cookieString.match(/accessToken=([^;]+)/);
      if (match && match[1]) {
        await setToken(match[1]);
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Muitas requisições. Aguarde 1 minuto.'));
    }
    return Promise.reject(error);
  }
);

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