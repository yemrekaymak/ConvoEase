import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  message: string;
  onHide: () => void;
  durationMs?: number;
};

export function ToastBanner({ visible, message, onHide, durationMs = 2800 }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, durationMs);
    return () => clearTimeout(t);
  }, [visible, durationMs, onHide]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 50,
    elevation: 6,
  },
  text: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
