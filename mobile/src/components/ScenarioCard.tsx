import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Scenario } from '../constants/scenarios';
import { colors } from '../theme/colors';

type Props = { scenario: Scenario; selected: boolean; onPress: () => void };

export function ScenarioCard({ scenario, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.emoji}>{scenario.emoji}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{scenario.title}</Text>
        <Text style={styles.subtitle}>{scenario.subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
  },
  pressed: { opacity: 0.92 },
  emoji: { fontSize: 28, marginRight: 12 },
  textWrap: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
});
