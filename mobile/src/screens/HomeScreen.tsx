import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScenarioCard } from '../components/ScenarioCard';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { apiRequest } from '../api/client';
import type { ScenarioDto } from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioDto[]>([]);
  const [scenarioId, setScenarioId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<ScenarioDto[]>('/api/scenarios/allowed');
        setScenarios(data);
      } catch (e: any) {
        setError(e?.message ?? 'Senaryolar alınamadı');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? null,
    [scenarios, scenarioId]
  );

  const difficultyLabel =
    selected?.difficultyLevel === 1
      ? 'Başlangıç'
      : selected?.difficultyLevel === 2
        ? 'Orta'
        : 'İleri';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Senaryo seç</Text>
        <Text style={styles.sub}>
          Kafe, otel, hastane, iş görüşmesi veya alışveriş ortamında pratik yap.
        </Text>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {scenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={{
              id: String(s.id) as any,
              title: s.name,
              emoji: '💬',
              subtitle:
                s.difficultyLevel === 1 ? 'Başlangıç' : s.difficultyLevel === 2 ? 'Orta' : 'İleri',
            }}
            selected={scenarioId === s.id}
            onPress={() => setScenarioId(s.id)}
          />
        ))}
        <PrimaryButton
          title="Sohbete başla"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            navigation.navigate('Chat', {
              scenarioId: selected.id,
              difficultyLabel,
              scenarioTitle: selected.name,
            });
          }}
        />
        <PrimaryButton
          title="Hata geçmişi (Mistakes)"
          variant="outline"
          onPress={() => navigation.navigate('Mistakes')}
          style={styles.secondary}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  secondary: { marginTop: 10 },
});
