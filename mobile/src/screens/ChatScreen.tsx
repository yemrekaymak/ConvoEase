import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import type {
  ConversationFeedbackDto,
  ConversationMessageResponseDto,
  ConversationStartResponseDto,
  ConversationTranscriptResponseDto,
  InteractionType,
  SessionReportDto,
} from '../api/types';
import { getTokens } from '../storage/secure';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type MsgRole = 'user' | 'assistant' | 'feedback' | 'error';
type Msg = { id: string; role: MsgRole; text: string };
type RecordingPhase = 'idle' | 'recording' | 'transcribing' | 'thinking';
const SPEECH_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

function resolveAudioUploadMeta(uri: string) {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith('.wav')) {
    return { name: 'recording.wav', type: 'audio/wav' };
  }
  if (lowerUri.endsWith('.webm')) {
    return { name: 'recording.webm', type: 'audio/webm' };
  }
  if (lowerUri.endsWith('.3gp')) {
    return { name: 'recording.3gp', type: 'audio/3gpp' };
  }
  return { name: 'recording.m4a', type: 'audio/mp4' };
}

function normalizeUploadUri(uri: string) {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
}

async function uploadAudioForTranscript(
  baseUrl: string,
  sessionId: string,
  accessToken: string | undefined,
  rawUri: string
): Promise<ConversationTranscriptResponseDto> {
  const uri = normalizeUploadUri(rawUri);
  const fileMeta = resolveAudioUploadMeta(uri);

  return await new Promise<ConversationTranscriptResponseDto>((resolve, reject) => {
    const form = new FormData();
    form.append('audioFile', {
      uri,
      name: fileMeta.name,
      type: fileMeta.type,
    } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/api/conversations/${sessionId}/transcribe`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Ses yukleme zaman asimina ugradi'));
    xhr.timeout = 45000;
    xhr.onload = () => {
      const raw = xhr.responseText || '';
      let payload: any = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = raw;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as ConversationTranscriptResponseDto);
        return;
      }

      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : payload && typeof payload === 'object' && 'detail' in payload
            ? String(payload.detail)
            : `Request failed (${xhr.status})`;
      reject(new Error(message));
    };

    xhr.send(form);
  });
}

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { scenarioTitle, difficultyLabel, interactionType, interactionLabel } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedInteractionType] = useState<InteractionType>(interactionType);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [recordingPhase, setRecordingPhase] = useState<RecordingPhase>('idle');
  const [recordingDurationMillis, setRecordingDurationMillis] = useState(0);
  const listRef = useRef<FlatList<Msg> | null>(null);
  const idCounterRef = useRef(0);
  const recorderRef = useRef<InstanceType<typeof AudioModule.AudioRecorder> | null>(null);

  const nextId = useCallback((suffix: string) => {
    idCounterRef.current += 1;
    return `${Date.now()}-${idCounterRef.current}-${suffix}`;
  }, []);

  const appendMessages = useCallback((items: Msg[]) => {
    if (items.length === 0) return;
    setMessages((current) => [...current, ...items]);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (safeSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  const buildFeedbackMessages = useCallback(
    (nextFeedback: ConversationFeedbackDto | null): Msg[] => {
      if (!nextFeedback) return [];

      const items: Msg[] = [];
      const lead =
        nextFeedback.writingFeedback ||
        nextFeedback.encouragement ||
        nextFeedback.errors[0]?.teachingTip ||
        null;

      if (lead) {
        items.push({
          id: nextId('feedback-main'),
          role: 'feedback',
          text: lead,
        });
      }

      nextFeedback.errors.slice(0, 3).forEach((feedbackError, index) => {
        const lines = [
          `Duzenleme ${index + 1}: ${feedbackError.wrongSentence} -> ${feedbackError.correctionText}`,
        ];
        if (feedbackError.teachingTip) {
          lines.push(feedbackError.teachingTip);
        } else if (feedbackError.whyWrong) {
          lines.push(feedbackError.whyWrong);
        }

        items.push({
          id: nextId(`feedback-${index}`),
          role: 'feedback',
          text: lines.join('\n'),
        });
      });

      return items;
    },
    [nextId]
  );

  const buildWritingAssistantText = useCallback((nextFeedback: ConversationFeedbackDto | null) => {
    const lead = nextFeedback?.encouragement?.trim() || nextFeedback?.writingFeedback?.trim() || '';
    if (lead) {
      return `English: Keep going with the scenario.\nTurkce: Devam et, senaryoyu surdur.\n\n${lead}`;
    }

    return 'English: Keep going and add one more short sentence.\nTurkce: Devam et ve bir kisa cumle daha ekle.';
  }, []);

  const cleanupRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (recorder) {
      try {
        await recorder.stop();
      } catch {
      }
    }

    recorderRef.current = null;
    setRecordingPhase('idle');
    setRecordingDurationMillis(0);
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch {
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 40);

    return () => clearTimeout(timeout);
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      void cleanupRecording();
    };
  }, [cleanupRecording]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const started = await apiRequest<ConversationStartResponseDto>('/api/conversations/start', {
          method: 'POST',
          body: { scenarioId: route.params.scenarioId, interactionType: selectedInteractionType },
        });
        setSessionId(started.sessionId);
        setMessages([
          {
            id: `${started.sessionId}-initial`,
            role: 'assistant',
            text: started.initialMessage,
          },
        ]);
      } catch (e: any) {
        const message = e?.message ?? 'Oturum baslatilamadi';
        setError(message);
        setMessages([
          {
            id: nextId('start-error'),
            role: 'error',
            text: message,
          },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [nextId, selectedInteractionType, route.params.scenarioId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !sessionId) return;

    appendMessages([{ id: nextId('user'), role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await apiRequest<ConversationMessageResponseDto>(
        `/api/conversations/${sessionId}/message`,
        {
          method: 'POST',
          body: { message: trimmed },
        }
      );
      const shouldInjectWritingAssistant =
        selectedInteractionType === 2 && !response.characterMessage;
      appendMessages([
        ...((response.characterMessage || shouldInjectWritingAssistant)
          ? [{
              id: nextId('assistant'),
              role: 'assistant' as const,
              text: response.characterMessage ?? buildWritingAssistantText(response.feedback),
            }]
          : []),
        ...buildFeedbackMessages(response.feedback),
      ]);
    } catch (e: any) {
      const message = e?.message ?? 'Mesaj gonderilemedi';
      setError(message);
      appendMessages([{ id: nextId('message-error'), role: 'error', text: message }]);
    } finally {
      setSending(false);
    }
  };

  const submitSpokenTranscript = useCallback(
    async (transcript: string) => {
      if (!sessionId) return;

      setSending(true);
      setError(null);
      setRecordingPhase('thinking');
      const thinkingId = nextId('ai-thinking');
      appendMessages([
        {
          id: thinkingId,
          role: 'feedback',
          text: 'AI dusunuyor...',
        },
      ]);

      try {
        const response = await apiRequest<ConversationMessageResponseDto>(
          `/api/conversations/${sessionId}/message`,
          {
            method: 'POST',
            body: { message: transcript },
          }
        );

        setMessages((current) =>
          current.flatMap((item) =>
            item.id === thinkingId
              ? [
                  ...buildFeedbackMessages(response.feedback),
                  ...(response.characterMessage
                    ? [{ id: nextId('assistant-speech'), role: 'assistant' as const, text: response.characterMessage }]
                    : []),
                ]
              : [item]
          )
        );
      } catch (e: any) {
        const message = e?.message ?? 'AI yaniti alinamadi';
        setError(message);
        setMessages((current) =>
          current.map((item) => (item.id === thinkingId ? { ...item, role: 'error', text: message } : item))
        );
      } finally {
        setRecordingPhase('idle');
        setSending(false);
      }
    },
    [appendMessages, buildFeedbackMessages, nextId, sessionId]
  );

  const sendSpeech = async (uri: string) => {
    if (!sessionId) return;

    setRecordingPhase('transcribing');
    setError(null);
    const pendingId = nextId('speech-pending');
    appendMessages([
      {
        id: pendingId,
        role: 'feedback',
        text: 'Konusman metne cevriliyor...',
      },
    ]);

    try {
      const baseUrl = await getApiBaseUrl();
      const tokens = await getTokens();
      const transcriptResponse = await uploadAudioForTranscript(
        baseUrl,
        sessionId,
        tokens?.accessToken,
        uri
      );
      const cleanedTranscript = transcriptResponse.transcript.trim();
      if (!cleanedTranscript) {
        throw new Error('Ses algilanamadi, tekrar konusman gerekiyor.');
      }
      setMessages((current) =>
        current.flatMap((item) =>
          item.id === pendingId
            ? [
                {
                  id: nextId('user-speech'),
                  role: 'user' as const,
                  text: cleanedTranscript,
                }
              ]
            : [item]
        )
      );
      setRecordingPhase('idle');
      await submitSpokenTranscript(cleanedTranscript);
    } catch (e: any) {
      const message = e?.message ?? 'Ses gonderilemedi';
      setError(message);
      setMessages((current) =>
        current.map((item) => (item.id === pendingId ? { ...item, role: 'error', text: message } : item))
      );
    } finally {
      setRecordingPhase('idle');
    }
  };

  const stopRecordingAndSend = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return false;

    await recorder.stop();
    const status = recorder.getStatus();
    const uri = status.url;
    const durationMillis = status.durationMillis ?? recordingDurationMillis ?? 0;
    recorderRef.current = null;
    if (!uri) {
      throw new Error('Ses kaydi alinamadi');
    }
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    await sendSpeech(uri);
    return true;
  }, [recordingDurationMillis]);

  const toggleRecording = async () => {
    if (!sessionId || recordingBusy || sending) return;

    setRecordingBusy(true);
    setError(null);

    try {
      if (recorderRef.current) {
        await stopRecordingAndSend();
        return;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Mikrofon izni gerekli. Tekrar deneyin.');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      const recorder = new AudioModule.AudioRecorder(SPEECH_RECORDING_OPTIONS);
      recorderRef.current = recorder;
      setRecordingDurationMillis(0);
      await recorder.prepareToRecordAsync(SPEECH_RECORDING_OPTIONS);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const preparedStatus = recorder.getStatus();
      if (!preparedStatus.canRecord) {
        throw new Error('Mikrofon kayda hazirlanamadi.');
      }
      recorder.record();
      setRecordingPhase('recording');
    } catch (e: any) {
      const message = e?.message ?? 'Mikrofon baslatilamadi';
      setError(message);
      appendMessages([{ id: nextId('recording-error'), role: 'error', text: message }]);
      await cleanupRecording();
    } finally {
      setRecordingBusy(false);
    }
  };

  const completeSession = useCallback(async () => {
    if (!sessionId || recordingBusy) return;

    try {
      setError(null);
      if (recorderRef.current) {
        setRecordingBusy(true);
        await stopRecordingAndSend();
        setRecordingBusy(false);
      }

      setSending(true);
      const report = await apiRequest<SessionReportDto>(
        `/api/conversations/${sessionId}/finish`,
        { method: 'POST' }
      );
      navigation.navigate('Summary', {
        scenarioTitle: report.scenarioName || scenarioTitle,
        difficultyLabel,
        interactionLabel,
        score: report.score,
        summaryReport: report.summaryReport,
        mistakeCount: report.mistakes.length,
        mistakes: report.mistakes,
      });
    } catch (e: any) {
      const message = e?.message ?? 'Oturum bitirilemedi';
      setError(message);
      appendMessages([{ id: nextId('finish-error'), role: 'error', text: message }]);
    } finally {
      setRecordingBusy(false);
      setSending(false);
    }
  }, [appendMessages, difficultyLabel, interactionLabel, navigation, nextId, recordingBusy, scenarioTitle, sessionId, stopRecordingAndSend]);

  const finishSession = useCallback(() => {
    Alert.alert(
      'Oturumu bitir',
      'Oturumu bitirmek istiyor musun? Onaylarsan ozet ekranina gececeksin.',
      [
        { text: 'Devam et', style: 'cancel' },
        { text: 'Bitir', onPress: () => void completeSession() },
      ]
    );
  }, [completeSession]);

  const handleBack = useCallback(() => {
    if (recordingPhase === 'recording' || sending || recordingBusy) {
      Alert.alert(
        'Cikmak istiyor musun?',
        'Bu oturum acik kalir. Donersen kaldigin yerden devam edebilirsin.',
        [
          { text: 'Vazgec', style: 'cancel' },
          {
            text: 'Cik',
            onPress: () => {
              void cleanupRecording();
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    void cleanupRecording();
    navigation.goBack();
  }, [cleanupRecording, navigation, recordingBusy, recordingPhase, sending]);

  useEffect(() => {
    if (recordingPhase !== 'recording') return;

    const interval = setInterval(() => {
      const status = recorderRef.current?.getStatus();
      setRecordingDurationMillis(status?.durationMillis ?? 0);
    }, 250);

    return () => clearInterval(interval);
  }, [recordingPhase]);

  const recordingSeconds = Math.floor(recordingDurationMillis / 1000);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
        >
          <Text style={styles.back}>{'< Geri'}</Text>
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>{scenarioTitle}</Text>
          <Text style={styles.headerSub}>{difficultyLabel} - {interactionLabel}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            style={styles.listView}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleWrap,
                  item.role === 'user' ? styles.bubbleWrapUser : item.role === 'error' ? styles.bubbleWrapCenter : styles.bubbleWrapBot,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.role === 'user'
                      ? styles.bubbleUser
                      : item.role === 'feedback'
                        ? styles.bubbleFeedback
                        : item.role === 'error'
                          ? styles.bubbleError
                          : styles.bubbleBot,
                  ]}
                >
                  <Text
                    style={
                      item.role === 'user'
                        ? styles.bubbleTextUser
                        : item.role === 'error'
                          ? styles.bubbleTextError
                          : styles.bubbleTextBot
                    }
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={sending ? <Text style={styles.typing}>AI yaziyor...</Text> : <View style={styles.listSpacer} />}
          />
        )}

        <View style={[styles.bottomDock, { paddingBottom: 12 + insets.bottom }]}>
          {selectedInteractionType === 1 ? (
            <Text style={styles.micStatus}>
              {recordingPhase === 'recording'
                ? `Mikrofon aktif. Konusman kaydediliyor. ${formatDuration(recordingSeconds)}`
                : recordingPhase === 'transcribing'
                  ? 'Kayit bitti. Konusman metne cevriliyor.'
                  : recordingPhase === 'thinking'
                    ? 'AI dusunuyor...'
                  : 'Mikrofona bas, konus, sonra tekrar basip kaydi bitir.'}
            </Text>
          ) : null}
          <View style={styles.composer}>
            {selectedInteractionType === 1 ? (
              <Pressable
                onPress={toggleRecording}
                style={[
                  styles.micButton,
                  (recordingBusy || !sessionId || sending) && styles.sendDisabled,
                  recordingPhase === 'recording' && styles.micButtonActive,
                ]}
                disabled={recordingBusy || !sessionId || sending}
              >
                <View style={styles.micButtonInner}>
                  {recordingPhase === 'recording' ? <View style={styles.recordingDot} /> : null}
                  <Text style={[styles.micText, recordingPhase === 'recording' && styles.micTextActive]}>
                    {recordingPhase === 'recording'
                      ? `Kaydi durdur ${formatDuration(recordingSeconds)}`
                      : recordingPhase === 'transcribing' || recordingPhase === 'thinking'
                        ? 'Konusma isleniyor...'
                        : 'Konusmaya basla'}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Ingilizce yaz..."
                  placeholderTextColor={colors.textSecondary}
                  value={input}
                  onChangeText={setInput}
                  editable={!loading && !!sessionId && !sending}
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={sendMessage}
                  style={[styles.send, (!input.trim() || !sessionId || sending) && styles.sendDisabled]}
                  disabled={!input.trim() || !sessionId || sending}
                >
                  <Text style={styles.sendText}>Gonder</Text>
                </Pressable>
              </>
            )}
          </View>

          <PrimaryButton
            title={sending ? '...' : 'Oturumu bitir'}
            variant="outline"
            disabled={!sessionId || sending || recordingBusy}
            onPress={finishSession}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { fontSize: 16, color: colors.primary, fontWeight: '600', width: 72 },
  headerMid: { flex: 1, alignItems: 'center' },
  headerRight: { width: 72 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  inlineError: { color: '#9B1C1C', marginHorizontal: 16, marginTop: 10 },
  loading: { flex: 1, justifyContent: 'center' },
  listView: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 },
  listSpacer: { height: 12 },
  bubbleWrap: { marginBottom: 12, maxWidth: '92%' },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubbleWrapBot: { alignSelf: 'flex-start' },
  bubbleWrapCenter: { alignSelf: 'center', maxWidth: '100%' },
  bubble: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 15 },
  bubbleUser: { backgroundColor: colors.userBubble },
  bubbleBot: { backgroundColor: colors.botBubble },
  bubbleFeedback: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  bubbleError: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F5B5B5',
  },
  bubbleTextUser: { color: '#fff', fontSize: 16, lineHeight: 24, flexShrink: 1 },
  bubbleTextBot: { color: colors.text, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  bubbleTextError: { color: '#9B1C1C', fontSize: 15, lineHeight: 22, flexShrink: 1 },
  typing: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  bottomDock: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  micStatus: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    minHeight: 112,
    maxHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    backgroundColor: colors.background,
  },
  micButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 12,
  },
  micButtonInner: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  micButtonActive: {
    backgroundColor: '#D9534F',
    borderColor: '#D9534F',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  micText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  micTextActive: {
    color: '#FFFFFF',
  },
  send: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 56,
    minWidth: 84,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
