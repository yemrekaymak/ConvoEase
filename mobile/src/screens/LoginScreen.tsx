import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { apiBaseUrl, login } = useAuth();
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
          <Pressable onPress={() => navigation.navigate('Home')} hitSlop={12}>
            <Text style={styles.logo}>ConvoEase</Text>
          </Pressable>
          <Text style={styles.tagline}>Hesabin varsa giris yap.</Text>
          <Text style={styles.serverInfo}>
            {apiBaseUrl ? `Baglanti adresi: ${apiBaseUrl}` : 'Baglanti adresi algilaniyor...'}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

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
            placeholder="Sifre"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <PrimaryButton
            title={busy ? '...' : 'Giris yap'}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                const user = await login({ email: email.trim(), password });
                navigation.reset({
                  index: 0,
                  routes: [{ name: user.currentLevel ? 'Home' : 'Placement' }],
                });
              } catch (e: any) {
                setError(
                  e?.message === 'Network request failed'
                    ? 'Backend baglantisi kurulamadi. Backend servisinin acik oldugundan emin ol.'
                    : e?.message ?? 'Giris basarisiz'
                );
              } finally {
                setBusy(false);
              }
            }}
            style={styles.button}
          />

          <PrimaryButton
            title="Hesabin yok mu? Kayit ol"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
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
  logo: { fontSize: 32, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  serverInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 22,
  },
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
