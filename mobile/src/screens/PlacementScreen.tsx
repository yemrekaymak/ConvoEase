import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiRequest } from '../api/client';
import type { LanguageLevel, QuestionDto, UserLevelResponseDto } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Placement'>;

type DifficultyPick = 'easy' | 'medium' | 'hard';

function toLevelFromPicks(picks: Record<number, DifficultyPick | undefined>): LanguageLevel {
  const values = Object.values(picks).filter(Boolean) as DifficultyPick[];
  if (values.length === 0) return 1;
  const score = values.reduce((acc, v) => acc + (v === 'easy' ? 2 : v === 'medium' ? 1 : 0), 0);
  const avg = score / (values.length * 2); // 0..1
  if (avg >= 0.72) return 3; // advanced
  if (avg >= 0.4) return 2; // intermediate
  return 1; // beginner
}

export function PlacementScreen({ navigation }: Props) {
  const { state, logout } = useAuth();
  const [questions, setQuestions] = useState<QuestionDto[] | null>(null);
  const [picks, setPicks] = useState<Record<number, DifficultyPick | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const q = await apiRequest<QuestionDto[]>('/api/questions');
        setQuestions(q);
      } catch (e: any) {
        setError(e?.message ?? 'Sorular alınamadı');
      }
    })();
  }, []);

  const answeredCount = useMemo(() => Object.values(picks).filter(Boolean).length, [picks]);

  if (state.status !== 'signed_in') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Placement Test</Text>
        <Text style={styles.sub}>
          Soruları cevapla. Değerlendirme (AI) sizde; burada basit bir seviye
          çıkarıp backend’e kaydediyoruz.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {questions?.map((q) => (
          <View key={q.id} style={styles.card}>
            <Text style={styles.q}>{q.text}</Text>
            <View style={styles.row}>
              <PrimaryButton
                title="Kolay"
                variant={picks[q.id] === 'easy' ? 'filled' : 'outline'}
                onPress={() => setPicks((p) => ({ ...p, [q.id]: 'easy' }))}
                style={styles.choice}
              />
              <PrimaryButton
                title="Orta"
                variant={picks[q.id] === 'medium' ? 'filled' : 'outline'}
                onPress={() => setPicks((p) => ({ ...p, [q.id]: 'medium' }))}
                style={styles.choice}
              />
              <PrimaryButton
                title="Zor"
                variant={picks[q.id] === 'hard' ? 'filled' : 'outline'}
                onPress={() => setPicks((p) => ({ ...p, [q.id]: 'hard' }))}
                style={styles.choice}
              />
            </View>
          </View>
        ))}

        <PrimaryButton
          title={busy ? '...' : `Seviyeyi kaydet ve devam et (${answeredCount}/${questions?.length ?? 0})`}
          disabled={busy || !questions || answeredCount === 0}
          onPress={async () => {
            if (!questions) return;
            setBusy(true);
            setError(null);
            try {
              const level = toLevelFromPicks(picks);
              await apiRequest<UserLevelResponseDto>('/api/users/level', {
                method: 'POST',
                body: { currentLevel: level },
              });
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } catch (e: any) {
              setError(e?.message ?? 'Seviye kaydedilemedi');
            } finally {
              setBusy(false);
            }
          }}
          style={styles.button}
        />

        <PrimaryButton
          title="Çıkış yap"
          variant="outline"
          onPress={async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
          style={styles.secondary}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  q: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { paddingVertical: 10, paddingHorizontal: 14, minWidth: 0, flexGrow: 1 },
  button: { marginTop: 8 },
  secondary: { marginTop: 10 },
});

