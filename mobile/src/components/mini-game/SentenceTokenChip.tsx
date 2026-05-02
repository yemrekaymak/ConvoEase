import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

export function SentenceTokenChip({
  label,
  selected,
  highlighted,
  disabled,
  onPress,
  onLongPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.selected,
        highlighted && styles.highlighted,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  highlighted: {
    borderColor: '#D7A52C',
    backgroundColor: '#FFF6DB',
  },
  disabled: { opacity: 0.5 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  selectedLabel: { color: '#fff' },
});
