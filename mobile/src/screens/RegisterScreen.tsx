import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('Berdan');
  const [lastName, setLastName] = useState('User');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        >
          <Text style={styles.logo}>Kayıt</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Ad"
            placeholderTextColor={colors.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Soyad"
            placeholderTextColor={colors.textSecondary}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre (min 8, A/a/0)"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <PrimaryButton
            title={busy ? '...' : 'Hesap oluştur'}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await register({ firstName, lastName, email, password });
                navigation.reset({ index: 0, routes: [{ name: 'Placement' }] });
              } catch (e: any) {
                setError(e?.message ?? 'Kayıt başarısız');
              } finally {
                setBusy(false);
              }
            }}
            style={styles.button}
          />

          <PrimaryButton
            title="Geri dön"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.secondary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  logo: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  button: { marginTop: 8 },
  secondary: { marginTop: 10 },
  error: { color: '#9B1C1C', marginBottom: 12 },
});

