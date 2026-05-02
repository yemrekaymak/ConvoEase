import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getVocabularyForScenario } from '../data/vocabulary';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ScenarioDictionary'>;

export function ScenarioDictionaryScreen({ navigation, route }: Props) {
  const { scenarioTitle, promptKey, difficultyLabel, difficultyLevel } = route.params;
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const base = getVocabularyForScenario(promptKey, difficultyLevel);
    const needle = query.trim().toLowerCase();
    if (!needle) return base;
    return base.filter(
      (item) =>
        item.word.toLowerCase().includes(needle) ||
        item.translation.toLowerCase().includes(needle)
    );
  }, [difficultyLevel, promptKey, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Dictionary</Text>
        </View>

        <Text style={styles.meta}>
          {scenarioTitle} - {difficultyLabel}
        </Text>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Kelime veya anlam ara..."
          placeholderTextColor={colors.textSecondary}
        />

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
            <Text style={styles.exampleLabel}>Example</Text>
            <Text style={styles.example}>{item.exampleSentence}</Text>
            <Text style={styles.exampleTranslation}>{item.exampleTranslation}</Text>
          </View>
        ))}

        {items.length === 0 ? <Text style={styles.empty}>Aramana uygun kelime bulunamadi.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  word: { fontSize: 18, fontWeight: '800', color: colors.text },
  translation: { marginTop: 4, fontSize: 15, color: colors.primary, fontWeight: '700' },
  exampleLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  example: { fontSize: 14, color: colors.text, lineHeight: 21 },
  exampleTranslation: { marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  empty: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
});
