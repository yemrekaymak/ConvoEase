import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import type {
  ConversationFeedbackDto,
  ConversationMessageResponseDto,
  ConversationStartResponseDto,
  InteractionType,
  SessionReportDto,
} from '../api/types';
import { getTokens } from '../storage/secure';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Msg = { id: string; role: 'user' | 'bot'; text: string };

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { scenarioTitle, difficultyLabel, interactionType, interactionLabel } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ConversationFeedbackDto | null>(null);
  const [selectedInteractionType] = useState<InteractionType>(interactionType);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);

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
            role: 'bot',
            text: started.initialMessage,
          },
        ]);
      } catch (e: any) {
        setError(e?.message ?? 'Oturum baslatilamadi');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedInteractionType, route.params.scenarioId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !sessionId) return;

    const userMsg: Msg = { id: `${Date.now()}-user`, role: 'user', text: trimmed };
    setMessages((current) => [...current, userMsg]);
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
      setFeedback(response.feedback);
      if (response.characterMessage) {
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-bot`,
            role: 'bot',
            text: response.characterMessage ?? '',
          },
        ]);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Mesaj gonderilemedi');
    } finally {
      setSending(false);
    }
  };

  const sendSpeech = async (uri: string) => {
    if (!sessionId) return;

    setSending(true);
    setError(null);

    try {
      const baseUrl = await getApiBaseUrl();
      const tokens = await getTokens();
      const form = new FormData();
      form.append('audioFile', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await fetch(`${baseUrl}/api/conversations/${sessionId}/speech`, {
        method: 'POST',
        headers: tokens?.accessToken
          ? { Authorization: `Bearer ${tokens.accessToken}` }
          : undefined,
        body: form,
      });

      const payload = (await response.json()) as ConversationMessageResponseDto | { message?: string };
      if (!response.ok) {
        throw new Error((payload as any)?.message ?? `Request failed (${response.status})`);
      }

      const messageResponse = payload as ConversationMessageResponseDto;
      setFeedback(messageResponse.feedback);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-user-speech`,
          role: 'user',
          text: messageResponse.transcript,
        },
        ...(messageResponse.characterMessage
          ? [
              {
                id: `${Date.now()}-bot-speech`,
                role: 'bot' as const,
                text: messageResponse.characterMessage,
              },
            ]
          : []),
      ]);
    } catch (e: any) {
      setError(e?.message ?? 'Ses gonderilemedi');
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (!sessionId || recordingBusy || sending) return;

    setRecordingBusy(true);
    setError(null);

    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (!uri) {
          throw new Error('Ses kaydi alinamadi');
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        await sendSpeech(uri);
        return;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Mikrofon izni gerekli');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const nextRecording = new Audio.Recording();
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await nextRecording.startAsync();
      setRecording(nextRecording);
    } catch (e: any) {
      setError(e?.message ?? 'Mikrofon baslatilamadi');
      setRecording(null);
    } finally {
      setRecordingBusy(false);
    }
  };

  const finishSession = useCallback(async () => {
    if (!sessionId) return;

    setSending(true);
    setError(null);
    try {
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
      });
    } catch (e: any) {
      setError(e?.message ?? 'Oturum bitirilemedi');
    } finally {
      setSending(false);
    }
  }, [difficultyLabel, interactionLabel, navigation, scenarioTitle, sessionId]);

  const feedbackMessage =
    feedback?.writingFeedback ||
    feedback?.encouragement ||
    feedback?.errors?.[0]?.teachingTip ||
    null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>{'< Geri'}</Text>
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>{scenarioTitle}</Text>
          <Text style={styles.headerSub}>{difficultyLabel} - {interactionLabel}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {feedbackMessage ? <FeedbackPanel message={feedbackMessage} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

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
                  item.role === 'user' ? styles.bubbleWrapUser : styles.bubbleWrapBot,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  <Text style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={sending ? <Text style={styles.typing}>Yanit bekleniyor...</Text> : <View style={styles.listSpacer} />}
          />
        )}

        <View style={[styles.bottomDock, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.composer}>
            {selectedInteractionType === 1 ? (
              <Pressable
                onPress={toggleRecording}
                style={[
                  styles.micButton,
                  (recordingBusy || !sessionId || sending) && styles.sendDisabled,
                  recording && styles.micButtonActive,
                ]}
                disabled={recordingBusy || !sessionId || sending}
              >
                <Text style={styles.micText}>{recording ? 'Kaydi durdur' : 'Mikrofonu ac'}</Text>
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
            disabled={!sessionId || sending}
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
  loading: { flex: 1, justifyContent: 'center' },
  error: { color: '#9B1C1C', marginHorizontal: 16, marginBottom: 8 },
  listView: { flex: 1 },
  list: { padding: 16, paddingBottom: 12 },
  listSpacer: { height: 8 },
  bubbleWrap: { marginBottom: 10, maxWidth: '88%' },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubbleWrapBot: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: colors.userBubble },
  bubbleBot: { backgroundColor: colors.botBubble },
  bubbleTextUser: { color: '#fff', fontSize: 16, lineHeight: 22, flexShrink: 1 },
  bubbleTextBot: { color: colors.text, fontSize: 16, lineHeight: 22, flexShrink: 1 },
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
  input: {
    flex: 1,
    minHeight: 84,
    maxHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    backgroundColor: colors.background,
  },
  micButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  micButtonActive: {
    backgroundColor: '#D9534F',
    borderColor: '#D9534F',
  },
  micText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
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
