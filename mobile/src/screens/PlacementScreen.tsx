import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import type {
  PlacementTestResultDto,
  QuestionDto,
  SubmitPlacementTestRequestDto,
} from '../api/types';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Placement'>;

export function PlacementScreen({ navigation }: Props) {
  const { state, logout } = useAuth();
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<QuestionDto[]>('/api/questions');
        setQuestions(data);
      } catch (e: any) {
        setError(e?.message ?? 'Sorular alinamadi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  if (state.status !== 'signed_in') {
    return null;
  }

  const goBack = async () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Seviye Testi</Text>
        </View>

        <Text style={styles.sub}>
          Tum sorulari cevapla. Sonucu backend hesaplayip seviyeni hesabina atayacak.
        </Text>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {questions.map((question) => (
          <View key={question.id} style={styles.card}>
            <Text style={styles.category}>{question.category}</Text>
            {question.passageTitle ? (
              <Text style={styles.passageTitle}>{question.passageTitle}</Text>
            ) : null}
            {question.passageText ? (
              <Text style={styles.passageText}>{question.passageText}</Text>
            ) : null}
            <Text style={styles.question}>
              {question.id}. {question.text}
            </Text>

            {question.options.map((option) => {
              const selected = answers[question.id] === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: option.key,
                    }))
                  }
                >
                  <Text style={[styles.optionKey, selected && styles.optionKeySelected]}>
                    {option.key}
                  </Text>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <PrimaryButton
          title={busy ? '...' : `Testi bitir ve devam et (${answeredCount}/${questions.length})`}
          disabled={busy || loading || !allAnswered}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              const request: SubmitPlacementTestRequestDto = {
                answers: questions.map((question) => ({
                  questionId: question.id,
                  selectedOption: answers[question.id],
                })),
              };
              await apiRequest<PlacementTestResultDto>('/api/questions/submit', {
                method: 'POST',
                body: request,
              });

              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (e: any) {
              setError(e?.message ?? 'Seviye kaydedilemedi');
            } finally {
              setBusy(false);
            }
          }}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  category: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  passageTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  passageText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  question: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
  },
  optionKey: { color: colors.primary, fontWeight: '800', width: 18 },
  optionKeySelected: { color: colors.primary },
  optionText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  optionTextSelected: { fontWeight: '700' },
  button: { marginTop: 8 },
});
