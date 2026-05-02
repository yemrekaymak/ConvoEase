import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  matched?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function MatchingPairCard({ label, selected, matched, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        selected && styles.selected,
        matched && styles.matched,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    minHeight: 58,
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
  },
  matched: {
    borderColor: '#A5D0BC',
    backgroundColor: '#EEF8F3',
  },
  disabled: { opacity: 0.55 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  selectedLabel: { color: colors.primary },
});
