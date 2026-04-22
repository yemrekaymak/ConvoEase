import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { title?: string; message: string };

export function FeedbackPanel({ title = 'Son düzeltme', message }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A5C00',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
