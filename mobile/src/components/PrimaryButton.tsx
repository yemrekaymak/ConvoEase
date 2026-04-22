import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  variant = 'filled',
  style,
}: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.filled,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, outline && styles.labelOutline]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  filled: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  labelOutline: { color: colors.primary },
});
