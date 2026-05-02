import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { MiniGameProgressHeader } from '../components/mini-game/MiniGameProgressHeader';
import { MiniGameResultCard } from '../components/mini-game/MiniGameResultCard';
import { SentenceTokenChip } from '../components/mini-game/SentenceTokenChip';
import { getSentenceChallenges } from '../data/sentenceChallenges';
import { findVocabularyMeaning } from '../data/vocabulary';
import { addMiniGameReview, awardMiniGameProgress } from '../utils/miniGameReview';
import { getHintTokenIndex, isSentenceCorrect, shuffleArray, splitSentenceTokens } from '../utils/miniGameHelpers';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SentenceBuilder'>;

export function SentenceBuilderScreen({ navigation, route }: Props) {
  const { scenarioId, scenarioTitle, promptKey, difficultyLabel, difficultyLevel } = route.params;
  const challenges = useMemo(
    () => getSentenceChallenges(promptKey, difficultyLevel),
    [difficultyLevel, promptKey]
  );
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [builtTokens, setBuiltTokens] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'playing' | 'success'>('playing');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const challenge = challenges[challengeIndex] ?? null;

  useEffect(() => {
    if (!challenge) return;
    setAvailableTokens(shuffleArray(splitSentenceTokens(challenge.sentence)));
    setBuiltTokens([]);
    setWrongAttempts(0);
    setHintIndex(null);
    setStatus('playing');
    setStatusMessage(null);
  }, [challenge]);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Bu senaryo icin henuz sentence builder verisi yok.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const builtSentence = builtTokens.join(' ');
  const total = challenges.length;

  const pushToken = (token: string, index: number) => {
    setBuiltTokens((current) => [...current, token]);
    setAvailableTokens((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeToken = (token: string, index: number) => {
    setAvailableTokens((current) => [...current, token]);
    setBuiltTokens((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetRound = () => {
    setAvailableTokens(shuffleArray(splitSentenceTokens(challenge.sentence)));
    setBuiltTokens([]);
    setHintIndex(null);
    setStatusMessage(null);
  };

  const showTokenMeaning = (token: string) => {
    const vocab = findVocabularyMeaning(promptKey, token, difficultyLevel);
    if (!vocab) {
      Alert.alert('Kelime yardimi', `${token}\n\nBu kelime icin kisa bir kart henuz yok.`);
      return;
    }

    Alert.alert(
      vocab.word,
      `${vocab.translation}${vocab.partOfSpeech ? `\n\nTur: ${vocab.partOfSpeech}` : ''}\n\nOrnek: ${vocab.exampleSentence}`
    );
  };

  const handleHint = () => {
    const suggestedIndex = getHintTokenIndex(challenge, builtTokens);
    if (suggestedIndex >= 0) {
      setHintIndex(suggestedIndex);
      setStatusMessage(`Ipucu: ${suggestedIndex + 1}. pozisyondaki kelimeye odaklan.`);
      return;
    }

    setStatusMessage(challenge.hint);
  };

  const handleCheck = async () => {
    if (isSentenceCorrect(challenge.sentence, builtSentence)) {
      setStatus('success');
      setStatusMessage('Harika. Cumleyi dogru sirayla kurdun.');
      await awardMiniGameProgress({ xp: 12, stars: 1, completed: true });
      return;
    }

    const nextWrongAttempts = wrongAttempts + 1;
    setWrongAttempts(nextWrongAttempts);
    setStatusMessage('Yakinlastin. Bir kez daha dene.');

    await addMiniGameReview({
      id: `${Date.now()}-sentence`,
      type: 'sentence_builder',
      scenarioId,
      scenarioTitle,
      promptKey,
      difficultyLabel,
      title: challenge.sentence,
      wrongAnswer: builtSentence || '(bos)',
      correction: challenge.sentence,
      note: challenge.note,
      createdAt: new Date().toISOString(),
    });
    await awardMiniGameProgress({ xp: 2, needsReview: true });

    if (nextWrongAttempts >= 2) {
      const suggestedIndex = getHintTokenIndex(challenge, builtTokens);
      setHintIndex(suggestedIndex >= 0 ? suggestedIndex : null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Sentence Builder</Text>
        </View>

        <MiniGameProgressHeader
          title={scenarioTitle}
          subtitle={`${difficultyLabel} seviyesinde cumleyi dogru siraya koy.`}
          progressText={`${challengeIndex + 1}/${total}`}
        />

        {statusMessage ? (
          <MiniGameResultCard
            title={status === 'success' ? 'Dogru siralama' : 'Ipuclu deneme'}
            body={statusMessage}
            accent={status === 'success' ? 'success' : 'warning'}
            footer={status === 'success' ? challenge.note : challenge.hint}
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cumle alani</Text>
          <View style={styles.tokenRow}>
            {builtTokens.length > 0 ? (
              builtTokens.map((token, index) => (
                <SentenceTokenChip
                  key={`${token}-${index}-built`}
                  label={token}
                  selected
                  highlighted={hintIndex === index}
                  onPress={() => removeToken(token, index)}
                  onLongPress={() => showTokenMeaning(token)}
                />
              ))
            ) : (
              <Text style={styles.placeholder}>Kelimelere dokun ve cumleyi kur.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Karisik kelimeler</Text>
          <View style={styles.tokenRow}>
            {availableTokens.map((token, index) => (
              <SentenceTokenChip
                key={`${token}-${index}-available`}
                label={token}
                onPress={() => pushToken(token, index)}
                onLongPress={() => showTokenMeaning(token)}
              />
            ))}
          </View>
        </View>

        {status === 'success' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.answerLabel}>Correct sentence</Text>
              <Text style={styles.answer}>{challenge.sentence}</Text>
              <Text style={styles.answerLabel}>Turkcesi</Text>
              <Text style={styles.translation}>{challenge.translation}</Text>
              <Text style={styles.note}>{challenge.note}</Text>
            </View>
            <PrimaryButton
              title="Speak this sentence"
              onPress={() =>
                navigation.navigate('PronunciationPractice', {
                  scenarioId,
                  scenarioTitle,
                  promptKey,
                  difficultyLevel,
                  difficultyLabel,
                  sentence: challenge.sentence,
                  translation: challenge.translation,
                })
              }
            />
            <PrimaryButton
              title={challengeIndex + 1 < total ? 'Siradaki cumle' : 'Tamamla'}
              variant="outline"
              onPress={() => {
                if (challengeIndex + 1 < total) {
                  setChallengeIndex((current) => current + 1);
                } else {
                  navigation.goBack();
                }
              }}
              style={styles.secondaryButton}
            />
          </>
        ) : (
          <>
            <PrimaryButton title="Cevabi kontrol et" onPress={() => void handleCheck()} />
            <PrimaryButton title="Ipucu" variant="outline" onPress={handleHint} style={styles.secondaryButton} />
            <PrimaryButton title="Sifirla" variant="outline" onPress={resetRound} style={styles.secondaryButton} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  placeholder: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  answerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 6,
  },
  answer: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  translation: { fontSize: 15, color: colors.primary, fontWeight: '700', marginBottom: 10 },
  note: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  secondaryButton: { marginTop: 10 },
});
