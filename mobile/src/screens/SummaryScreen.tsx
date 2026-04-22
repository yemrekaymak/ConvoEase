import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

const MOCK_TOPICS = [
  'Zaman ifadeleri (present perfect vs simple past)',
  'Nazik sipariş kalıpları (would like / could I)',
];

export function SummaryScreen({ navigation, route }: Props) {
  const { scenarioTitle, difficultyLabel } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Oturum özeti</Text>
        <Text style={styles.meta}>
          {scenarioTitle} · {difficultyLabel}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Puan (örnek)</Text>
          <Text style={styles.score}>72 / 100</Text>
          <Text style={styles.cardHint}>Gerçek skor backend hazır olunca burada.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Geliştirme alanları</Text>
          {MOCK_TOPICS.map((t) => (
            <Text key={t} style={styles.bullet}>
              • {t}
            </Text>
          ))}
        </View>
        <PrimaryButton
          title="Yeni oturum"
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: '800', color: colors.text },
  meta: { marginTop: 6, fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  score: { fontSize: 36, fontWeight: '800', color: colors.primary },
  cardHint: { marginTop: 8, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  bullet: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 6 },
});
