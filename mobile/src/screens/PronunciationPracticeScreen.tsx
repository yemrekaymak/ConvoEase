import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioModule, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { MiniGameProgressHeader } from '../components/mini-game/MiniGameProgressHeader';
import { MiniGameResultCard } from '../components/mini-game/MiniGameResultCard';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { addMiniGameReview, awardMiniGameProgress } from '../utils/miniGameReview';
import { scorePronunciationAttempt, uploadAudioForPreviewTranscript } from '../utils/pronunciation';

const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

type Props = NativeStackScreenProps<RootStackParamList, 'PronunciationPractice'>;

export function PronunciationPracticeScreen({ navigation, route }: Props) {
  const { scenarioId, scenarioTitle, promptKey, difficultyLabel, sentence, translation } = route.params;
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<InstanceType<typeof AudioModule.AudioRecorder> | null>(null);

  const cleanup = useCallback(async () => {
    try {
      await recorderRef.current?.stop();
    } catch {
    }
    recorderRef.current = null;
    setRecording(false);
    setDurationMillis(0);
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
    }
  }, []);

  useEffect(() => () => {
    void cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      setDurationMillis(recorderRef.current?.getStatus().durationMillis ?? 0);
    }, 250);
    return () => clearInterval(interval);
  }, [recording]);

  const toggleRecording = async () => {
    if (busy) return;
    setError(null);

    if (recorderRef.current) {
      setBusy(true);
      try {
        await recorderRef.current.stop();
        const status = recorderRef.current.getStatus();
        const uri = status.url;
        recorderRef.current = null;
        setRecording(false);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

        if (!uri) throw new Error('Ses kaydi alinamadi');

        const response = await uploadAudioForPreviewTranscript(uri);
        const nextTranscript = response.transcript.trim();
        setTranscript(nextTranscript);
        const scored = scorePronunciationAttempt(sentence, nextTranscript);
        setResult(scored);

        if (scored.score < 70) {
          await addMiniGameReview({
            id: `${Date.now()}-pronunciation`,
            type: 'pronunciation',
            scenarioId,
            scenarioTitle,
            promptKey,
            difficultyLabel,
            title: sentence,
            wrongAnswer: nextTranscript || '(bos)',
            correction: sentence,
            note: `${scored.status} - ${scored.score}/100`,
            createdAt: new Date().toISOString(),
          });
          await awardMiniGameProgress({ xp: 3, needsReview: true });
        } else {
          await awardMiniGameProgress({
            xp: scored.score >= 90 ? 10 : 7,
            stars: scored.score >= 90 ? 1 : 0,
            completed: true,
          });
        }
      } catch (e: any) {
        setError(e?.message ?? 'Konusma islenemedi');
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Mikrofon izni gerekli. Tekrar dene.');
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const recorder = new AudioModule.AudioRecorder(RECORDING_OPTIONS);
      recorderRef.current = recorder;
      setDurationMillis(0);
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
      await new Promise((resolve) => setTimeout(resolve, 80));
      if (!recorder.getStatus().canRecord) {
        throw new Error('Mikrofon kayda hazirlanamadi.');
      }
      recorder.record();
      setTranscript(null);
      setResult(null);
      setRecording(true);
    } catch (e: any) {
      setError(e?.message ?? 'Kayit baslatilamadi');
      await cleanup();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Build then Speak</Text>
        </View>

        <MiniGameProgressHeader
          title={scenarioTitle}
          subtitle={`${difficultyLabel} seviyesinde cumleyi sesli oku.`}
        />

        <View style={styles.card}>
          <Text style={styles.label}>Read this sentence</Text>
          <Text style={styles.sentence}>{sentence}</Text>
          <Text style={styles.translation}>{translation}</Text>
        </View>

        {recording ? (
          <MiniGameResultCard
            title="Kayit acik"
            body={`Konusma kaydediliyor. Tekrar basip bitirebilirsin. ${Math.floor(durationMillis / 1000)} sn`}
            accent="warning"
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {transcript ? (
          <View style={styles.card}>
            <Text style={styles.label}>Transcript</Text>
            <Text style={styles.transcript}>{transcript}</Text>
          </View>
        ) : null}

        {result ? (
          <MiniGameResultCard
            title={result.status}
            body={`Skor: ${result.score}/100`}
            accent={result.score >= 70 ? 'success' : 'warning'}
            footer={
              result.score >= 70
                ? 'Cok iyi. Simdi normal speaking practice akisina gecmek daha dogal olur.'
                : 'Tekrar deneyip kelimeleri biraz daha net ve sirayla soyle.'
            }
          />
        ) : null}

        <PrimaryButton
          title={
            busy
              ? '...'
              : recording
                ? 'Kaydi durdur ve kontrol et'
                : 'Cumleyi sesli soyle'
          }
          disabled={busy}
          onPress={() => void toggleRecording()}
        />

        {busy ? <ActivityIndicator style={styles.loader} /> : null}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 8,
  },
  sentence: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 28 },
  translation: { fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  transcript: { fontSize: 15, color: colors.text, lineHeight: 22 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  loader: { marginTop: 12 },
});
