import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import type { MistakeDto, PagedResponseDto } from '../api/types';
import { colors } from '../theme/colors';
import type { MiniGameReviewItem } from '../types/miniGames';
import { getMiniGameReviews } from '../utils/miniGameReview';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Mistakes'>;

export function MistakesScreen({ navigation }: Props) {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MistakeDto[]>([]);
  const [miniGameItems, setMiniGameItems] = useState<MiniGameReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<PagedResponseDto<MistakeDto>>(
        `/api/mistakes?page=${nextPage}&pageSize=20`
      );
      setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setPage(res.page);
      setHasMore(res.page * res.pageSize < res.totalCount);
    } catch (e: any) {
      setError(e?.message ?? 'Hata gecmisi alinamadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.status !== 'signed_in') {
      setItems([]);
      setHasMore(false);
      setLoading(false);
      setError('Hata gecmisi icin giris yapman gerekiyor.');
      return;
    }

    void load(1);
    void getMiniGameReviews().then(setMiniGameItems);
  }, [state.status]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Hata gecmisi</Text>
          <View style={styles.spacer} />
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.meta}>{item.scenarioName}</Text>
            <Text style={styles.type}>{item.errorType}</Text>
            <Text style={styles.label}>Yanlis:</Text>
            <Text style={styles.body}>{item.wrongSentence}</Text>
            <Text style={styles.label}>Dogrusu:</Text>
            <Text style={styles.body}>{item.correctionText}</Text>
          </View>
        ))}

        {miniGameItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mini game review</Text>
            {miniGameItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.meta}>{item.scenarioTitle} - {item.difficultyLabel}</Text>
                <Text style={styles.type}>{item.type}</Text>
                <Text style={styles.label}>Deneme:</Text>
                <Text style={styles.body}>{item.wrongAnswer}</Text>
                <Text style={styles.label}>Dogrusu:</Text>
                <Text style={styles.body}>{item.correction}</Text>
                {item.note ? (
                  <>
                    <Text style={styles.label}>Not:</Text>
                    <Text style={styles.body}>{item.note}</Text>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {hasMore ? (
          <PrimaryButton
            title={loading ? '...' : 'Daha fazla yukle'}
            disabled={loading}
            onPress={() => load(page + 1)}
            style={styles.loadMore}
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
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  spacer: { width: 60 },
  error: { color: '#9B1C1C', marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meta: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '700' },
  type: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 8 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 },
  loadMore: { marginTop: 8 },
});
