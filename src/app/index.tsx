import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth-store'

export default function Index() {
  const { token, role } = useAuthStore();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'ADMIN') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(aluno)" />;
}