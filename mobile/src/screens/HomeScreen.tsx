import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import type { ScenarioGroupDto } from '../api/types';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { state, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<ScenarioGroupDto[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          state.status === 'signed_in' ? '/api/scenarios/browse' : '/api/scenarios/catalog';
        const data = await apiRequest<ScenarioGroupDto[]>(endpoint, {
          auth: state.status === 'signed_in',
        });
        setGroups(data);
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 401) {
          setError('Senaryolari gormek icin giris yapman gerekiyor.');
        } else {
          setError(e?.message ?? 'Senaryolar alinamadi');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [state.status]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.heading}>Senaryolar</Text>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={styles.menuButton}>
            <Text style={styles.menuIcon}>≡</Text>
          </Pressable>
        </View>

        <Text style={styles.sub}>
          Bir ana senaryo sec. Alt senaryolar kolay, orta ve zor olarak sonraki sayfada acilacak.
        </Text>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          {groups.map((group, index) => (
            <Pressable
              key={group.key}
              onPress={() =>
                navigation.navigate('ScenarioGroup', {
                  groupKey: group.key,
                  groupName: group.name,
                })
              }
              style={styles.groupCard}
            >
              <Text style={styles.groupIndex}>{index + 1}</Text>
              <View style={styles.groupBody}>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <Text style={styles.groupMeta}>{group.items.length} alt senaryo</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <Text style={styles.menuTitle}>Hesabim</Text>
            {state.status === 'signed_in' ? (
              <>
                <Text style={styles.menuName}>
                  {state.user.firstName} {state.user.lastName}
                </Text>
                <Text style={styles.menuEmail}>{state.user.email}</Text>
                <PrimaryButton
                  title="Hata gecmisi"
                  variant="outline"
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate('Mistakes');
                  }}
                  style={styles.menuAction}
                />
                <PrimaryButton
                  title="Oturumu kapat"
                  onPress={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                  }}
                  style={styles.menuAction}
                />
              </>
            ) : (
              <>
                <Text style={styles.menuEmail}>Misafir gorunumu</Text>
                <PrimaryButton
                  title="Giris yap"
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate('Login');
                  }}
                  style={styles.menuAction}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  section: { marginBottom: 18 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  groupIndex: {
    width: 28,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  groupBody: { flex: 1 },
  groupTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  groupMeta: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingRight: 16,
  },
  menuPanel: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  menuTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  menuName: { fontSize: 16, fontWeight: '700', color: colors.text },
  menuEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 14 },
  menuAction: { marginTop: 10 },
});
