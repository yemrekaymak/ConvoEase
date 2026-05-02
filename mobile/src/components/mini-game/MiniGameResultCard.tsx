import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  body: string;
  accent?: 'success' | 'warning';
  footer?: string;
};

export function MiniGameResultCard({ title, body, accent = 'success', footer }: Props) {
  const warning = accent === 'warning';
  return (
    <View style={[styles.card, warning ? styles.warningCard : styles.successCard]}>
      <Text style={[styles.title, warning ? styles.warningTitle : styles.successTitle]}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  successCard: {
    backgroundColor: '#EAF6F0',
    borderColor: '#A5D0BC',
  },
  warningCard: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  successTitle: { color: colors.primary },
  warningTitle: { color: '#8C6400' },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
  footer: { marginTop: 8, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
