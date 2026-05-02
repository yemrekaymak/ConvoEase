import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  subtitle: string;
  progressText?: string;
};

export function MiniGameProgressHeader({ title, subtitle, progressText }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {progressText ? <Text style={styles.progress}>{progressText}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  body: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  progress: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
});
