import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScenarioCard } from '../components/ScenarioCard';
import {
  DIFFICULTY_OPTIONS,
  SCENARIOS,
  type Difficulty,
  type ScenarioId,
} from '../constants/scenarios';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  const selected = SCENARIOS.find((s) => s.id === scenarioId);
  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label ?? 'Başlangıç';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Senaryo seç</Text>
        <Text style={styles.sub}>
          Kafe, otel, hastane, iş görüşmesi veya alışveriş ortamında pratik yap.
        </Text>
        {SCENARIOS.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            selected={scenarioId === s.id}
            onPress={() => setScenarioId(s.id)}
          />
        ))}
        <Text style={styles.sectionTitle}>Zorluk</Text>
        <View style={styles.chips}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <PrimaryButton
              key={opt.id}
              title={opt.label}
              variant={difficulty === opt.id ? 'filled' : 'outline'}
              onPress={() => setDifficulty(opt.id)}
              style={styles.chip}
            />
          ))}
        </View>
        <PrimaryButton
          title="Sohbete başla"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            navigation.navigate('Chat', {
              scenarioId: selected.id,
              scenarioTitle: selected.title,
              difficulty,
              difficultyLabel,
            });
          }}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { paddingVertical: 10, paddingHorizontal: 14 },
});
