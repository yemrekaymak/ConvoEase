import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ navigation, route }: Props) {
  const { scenarioTitle, difficultyLabel, interactionLabel, score, summaryReport } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>Oturum ozeti</Text>
        </View>

        <Text style={styles.meta}>
          {scenarioTitle} - {difficultyLabel} - {interactionLabel}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Puan</Text>
          <Text style={styles.score}>{score == null ? '-' : `${score} / 100`}</Text>
        </View>

        {summaryReport ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Rapor</Text>
            <Text style={styles.body}>{summaryReport}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Yeni oturum"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
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
  heading: { fontSize: 26, fontWeight: '800', color: colors.text },
  meta: { marginTop: 6, fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
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
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
