import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { ToastBanner } from '../components/ToastBanner';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { apiRequest } from '../api/client';
import type {
  CompleteSessionRequestDto,
  InteractionType,
  SessionDto,
  UpdateSessionProgressRequestDto,
} from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Msg = { id: string; role: 'user' | 'bot'; text: string };

const MOCK_THREAD: Msg[] = [
  { id: '1', role: 'bot', text: 'Hello! What would you like to order?' },
  { id: '2', role: 'user', text: 'I want coffee please.' },
  { id: '3', role: 'bot', text: 'Great. Small, medium, or large?' },
];

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { scenarioTitle, difficultyLabel } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>(MOCK_THREAD);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [session, setSession] = useState<SessionDto | null>(null);
  const [interactionType] = useState<InteractionType>(2); // Writing
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const hideToast = useCallback(() => setToastVisible(false), []);

  useEffect(() => {
    return () => {
      void (async () => {
        try {
          const rec = recordingRef.current;
          if (rec) {
            await rec.stopAndUnloadAsync();
          }
        } catch {
          // ignore
        } finally {
          recordingRef.current = null;
        }
      })();
    };
  }, []);

  const sendMock = async () => {
    const t = input.trim();
    if (!t) return;
    setLoading(true);
    setInput('');
    const userMsg: Msg = { id: String(Date.now()), role: 'user', text: t };
    const botMsg: Msg = {
      id: String(Date.now() + 1),
      role: 'bot',
      text: '(Mock) Backend bağlanınca gerçek yanıt gelecek.',
    };
    const next = [...messages, userMsg, botMsg];
    setMessages(next);
    try {
      await saveProgress(next);
    } catch {
      // ignore progress failures in mock mode
    } finally {
      setLoading(false);
    }
  };

  const ensureSession = useCallback(async () => {
    if (session) return session;
    const created = await apiRequest<SessionDto>('/api/sessions', {
      method: 'POST',
      body: { scenarioId: route.params.scenarioId, interactionType },
    });
    setSession(created);
    return created;
  }, [session, route.params.scenarioId, interactionType]);

  const saveProgress = useCallback(
    async (nextMessages: Msg[]) => {
      const s = await ensureSession();
      const payload = {
        scenarioId: s.scenarioId,
        interactionType: s.interactionType,
        messages: nextMessages.slice(-20), // keep small for 10KB
      };
      const json = JSON.stringify(payload);
      const req: UpdateSessionProgressRequestDto = { lastProgressJson: json };
      await apiRequest<SessionDto>(`/api/sessions/${s.id}/progress`, {
        method: 'PATCH',
        body: req,
      });
    },
    [ensureSession]
  );

  const toggleRecording = useCallback(async () => {
    setMicError(null);
    if (isRecording) {
      try {
        const rec = recordingRef.current;
        if (!rec) {
          setIsRecording(false);
          return;
        }
        await rec.stopAndUnloadAsync();
        const status = await rec.getStatusAsync();
        const uri = rec.getURI();
        recordingRef.current = null;
        setIsRecording(false);

        const seconds =
          typeof (status as any)?.durationMillis === 'number'
            ? Math.max(1, Math.round((status as any).durationMillis / 1000))
            : 1;

        // Backend STT yok; şimdilik ses kaydı tamamlandı bilgisini mesaj olarak ekliyoruz.
        const next: Msg[] = [
          ...messages,
          { id: String(Date.now()), role: 'user', text: `🎤 Voice message (${seconds}s)` },
          {
            id: String(Date.now() + 1),
            role: 'bot',
            text: uri
              ? '(Mock) Ses kaydı alındı. STT/AI gelince metne çevireceğiz.'
              : '(Mock) Ses kaydı alındı.',
          },
        ];
        setMessages(next);
        try {
          await saveProgress(next);
        } catch {
          // ignore
        }
      } catch (e: any) {
        setMicError(e?.message ?? 'Kayıt durdurulamadı');
        setIsRecording(false);
      }
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setMicError('Mikrofon izni gerekli.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
    } catch (e: any) {
      setMicError(e?.message ?? 'Mikrofon başlatılamadı');
      setIsRecording(false);
    }
  }, [isRecording, messages, saveProgress]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>{scenarioTitle}</Text>
          <Text style={styles.headerSub}>{difficultyLabel}</Text>
        </View>
        <Pressable onPress={() => setToastVisible(true)} hitSlop={12}>
          <Text style={styles.toastLink}>Toast</Text>
        </Pressable>
      </View>

      <ToastBanner
        visible={toastVisible}
        message="Örnek: “I would like…” siparişte daha doğal olabilir."
        onHide={hideToast}
      />

      <FeedbackPanel message="İpucu: “I’d like…” nazik sipariş için uygundur. (Statik örnek)" />
      {micError ? <Text style={styles.micError}>{micError}</Text> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
                <Text
                  style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? <Text style={styles.typing}>Bot yazıyor…</Text> : null
          }
        />

        <View style={styles.composer}>
          <Pressable
            style={[styles.mic, isRecording && styles.micActive]}
            hitSlop={8}
            onPress={toggleRecording}
          >
            <Text style={styles.micText}>{isRecording ? '⏺' : '🎤'}</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="İngilizce yaz…"
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            onPress={sendMock}
            style={[styles.send, !input.trim() && styles.sendDisabled]}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>Gönder</Text>
          </Pressable>
        </View>

        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <PrimaryButton
            title="Oturumu bitir"
            variant="outline"
            onPress={async () => {
              setLoading(true);
              try {
                const s = await ensureSession();
                const req: CompleteSessionRequestDto = {
                  sessionId: s.id,
                  score: 0,
                  summaryReport: 'Demo summary (AI/harici servis sonra eklenecek).',
                  mistakes: [],
                };
                await apiRequest<SessionDto>('/api/sessions/complete', {
                  method: 'POST',
                  body: req,
                });
              } finally {
                setLoading(false);
              }
              navigation.navigate('Summary', { scenarioTitle, difficultyLabel });
            }}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toastLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    width: 72,
    textAlign: 'right',
  },
  list: { padding: 16, paddingBottom: 16 },
  bubbleWrap: { marginBottom: 10, maxWidth: '88%' },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubbleWrapBot: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: colors.userBubble },
  bubbleBot: { backgroundColor: colors.botBubble },
  bubbleTextUser: { color: '#fff', fontSize: 16, lineHeight: 22 },
  bubbleTextBot: { color: colors.text, fontSize: 16, lineHeight: 22 },
  typing: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.botBubble,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micActive: {
    backgroundColor: '#FFE1E1',
  },
  micText: { fontSize: 20 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  send: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginBottom: 2,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 4, backgroundColor: colors.surface },
  micError: { marginHorizontal: 16, marginBottom: 8, color: '#9B1C1C' },
});
