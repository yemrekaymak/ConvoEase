import { useCallback, useState } from 'react';
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
import { FeedbackPanel } from '../components/FeedbackPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { ToastBanner } from '../components/ToastBanner';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

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

  const hideToast = useCallback(() => setToastVisible(false), []);

  const sendMock = () => {
    const t = input.trim();
    if (!t) return;
    setLoading(true);
    setInput('');
    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', text: t }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'bot',
          text: '(Mock) Backend bağlanınca gerçek yanıt gelecek.',
        },
      ]);
      setLoading(false);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
          <Pressable style={styles.mic} hitSlop={8}>
            <Text style={styles.micText}>🎤</Text>
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
            onPress={() =>
              navigation.navigate('Summary', { scenarioTitle, difficultyLabel })
            }
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
  list: { padding: 16, paddingBottom: 8 },
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
    paddingVertical: 10,
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
});
