import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { MatchingPairCard } from '../components/mini-game/MatchingPairCard';
import { MiniGameProgressHeader } from '../components/mini-game/MiniGameProgressHeader';
import { MiniGameResultCard } from '../components/mini-game/MiniGameResultCard';
import { getMatchingItems } from '../data/matchingChallenges';
import { colors } from '../theme/colors';
import type { MatchingItem } from '../types/miniGames';
import { addMiniGameReview, awardMiniGameProgress } from '../utils/miniGameReview';
import { shuffleArray } from '../utils/miniGameHelpers';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WordMatching'>;

export function WordMatchingScreen({ navigation, route }: Props) {
  const { scenarioId, scenarioTitle, promptKey, difficultyLabel, difficultyLevel } = route.params;
  const baseItems = useMemo(() => getMatchingItems(promptKey, difficultyLevel), [difficultyLevel, promptKey]);
  const [englishItems, setEnglishItems] = useState<MatchingItem[]>([]);
  const [turkishItems, setTurkishItems] = useState<MatchingItem[]>([]);
  const [selectedEnglishId, setSelectedEnglishId] = useState<string | null>(null);
  const [selectedTurkishId, setSelectedTurkishId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPairs, setWrongPairs] = useState<Array<{ english: string; turkish: string; correct: string }>>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    setEnglishItems(baseItems);
    setTurkishItems(shuffleArray(baseItems));
  }, [baseItems]);

  useEffect(() => {
    if (!selectedEnglishId || !selectedTurkishId) return;
    const english = baseItems.find((item) => item.id === selectedEnglishId);
    const turkish = baseItems.find((item) => item.id === selectedTurkishId);
    if (!english || !turkish) return;

    if (english.id === turkish.id) {
      setMatchedIds((current) => [...current, english.id]);
      setResultMessage(`Dogru eslesme: ${english.english} = ${english.turkish}`);
      void awardMiniGameProgress({ xp: 6, stars: 1 });
    } else {
      setWrongPairs((current) => [
        ...current,
        {
          english: english.english,
          turkish: turkish.turkish,
          correct: english.turkish,
        },
      ]);
      setResultMessage('Bu eslesme olmadi. Bir kez daha dene.');
      void addMiniGameReview({
        id: `${Date.now()}-match`,
        type: 'word_matching',
        scenarioId,
        scenarioTitle,
        promptKey,
        difficultyLabel,
        title: english.english,
        wrongAnswer: turkish.turkish,
        correction: english.turkish,
        createdAt: new Date().toISOString(),
      });
      void awardMiniGameProgress({ xp: 2, needsReview: true });
    }

    setSelectedEnglishId(null);
    setSelectedTurkishId(null);
  }, [baseItems, difficultyLabel, promptKey, scenarioId, scenarioTitle, selectedEnglishId, selectedTurkishId]);

  const finished = matchedIds.length === baseItems.length && baseItems.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Word Matching</Text>
        </View>

        <MiniGameProgressHeader
          title={scenarioTitle}
          subtitle={`${difficultyLabel} seviyesinde kelimeleri anlamlariyla eslestir.`}
          progressText={`${matchedIds.length}/${baseItems.length}`}
        />

        {resultMessage ? (
          <MiniGameResultCard
            title={finished ? 'Tur bitti' : 'Anlik geri bildirim'}
            body={resultMessage}
            accent={finished ? 'success' : 'warning'}
          />
        ) : null}

        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>English</Text>
            {englishItems.map((item) => (
              <MatchingPairCard
                key={item.id}
                label={item.english}
                selected={selectedEnglishId === item.id}
                matched={matchedIds.includes(item.id)}
                disabled={matchedIds.includes(item.id)}
                onPress={() => setSelectedEnglishId(item.id)}
              />
            ))}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Turkce</Text>
            {turkishItems.map((item) => (
              <MatchingPairCard
                key={item.id}
                label={item.turkish}
                selected={selectedTurkishId === item.id}
                matched={matchedIds.includes(item.id)}
                disabled={matchedIds.includes(item.id)}
                onPress={() => setSelectedTurkishId(item.id)}
              />
            ))}
          </View>
        </View>

        {finished ? (
          <>
            <View style={styles.card}>
              <Text style={styles.summaryTitle}>Sonuc</Text>
              <Text style={styles.summaryBody}>Skor: {matchedIds.length} / {baseItems.length}</Text>
              <Text style={styles.summaryBody}>Yanlis deneme: {wrongPairs.length}</Text>
            </View>
            {wrongPairs.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.summaryTitle}>Review</Text>
                {wrongPairs.map((pair, index) => (
                  <View key={`${pair.english}-${index}`} style={styles.reviewItem}>
                    <Text style={styles.reviewWrong}>{pair.english} {'->'} {pair.turkish}</Text>
                    <Text style={styles.reviewCorrect}>Dogrusu: {pair.correct}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <PrimaryButton
              title="Tamamla"
              onPress={async () => {
                await awardMiniGameProgress({ xp: 10, completed: true });
                navigation.goBack();
              }}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  columns: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  column: { flex: 1 },
  columnTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  summaryBody: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 4 },
  reviewItem: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reviewWrong: { fontSize: 14, color: '#9B1C1C', fontWeight: '700' },
  reviewCorrect: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
