import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiRequest } from '../api/client';
import type { MistakeDto, PagedResponseDto } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Mistakes'>;

export function MistakesScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MistakeDto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<PagedResponseDto<MistakeDto>>(
        `/api/mistakes?page=${p}&pageSize=20`
      );
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setPage(res.page);
      setHasMore(res.page * res.pageSize < res.totalCount);
    } catch (e: any) {
      setError(e?.message ?? 'Hata geçmişi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <PrimaryButton title="‹ Geri" variant="outline" onPress={() => navigation.goBack()} />
          <Text style={styles.heading}>Mistakes</Text>
          <View style={{ width: 90 }} />
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {items.map((m) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.meta}>{m.scenarioName}</Text>
            <Text style={styles.type}>{m.errorType}</Text>
            <Text style={styles.label}>Yanlış:</Text>
            <Text style={styles.body}>{m.wrongSentence}</Text>
            <Text style={styles.label}>Doğrusu:</Text>
            <Text style={styles.body}>{m.correctionText}</Text>
          </View>
        ))}

        {hasMore ? (
          <PrimaryButton
            title={loading ? '...' : 'Daha fazla yükle'}
            disabled={loading}
            onPress={() => load(page + 1)}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  error: { color: '#9B1C1C', marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meta: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '700' },
  type: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 8 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 },
});

