import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import type { InteractionType, ScenarioGroupDto, ScenarioItemDto } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ScenarioGroup'>;

function getDifficultyLabel(level: number) {
  if (level === 1) return 'Kolay';
  if (level === 2) return 'Orta';
  return 'Zor';
}

function getDifficultyColor(level: number) {
  if (level === 1) return '#4F8A5B';
  if (level === 2) return '#C58B1C';
  return '#B24646';
}

function getItemsByLevel(items: ScenarioItemDto[], level: number) {
  return items.filter((item) => item.difficultyLevel === level);
}

export function ScenarioGroupScreen({ navigation, route }: Props) {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<ScenarioGroupDto | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [interactionType, setInteractionType] = useState<InteractionType>(2);

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
        const matched = data.find((item) => item.key === route.params.groupKey) ?? null;
        setGroup(matched);
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 401) {
          setError('Senaryolari gormek icin giris yapman gerekiyor.');
        } else {
          setError(e?.message ?? 'Alt senaryolar alinamadi');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params.groupKey, state.status]);

  const selectedScenario = useMemo(
    () => group?.items.find((item) => item.id === selectedScenarioId) ?? null,
    [group, selectedScenarioId]
  );

  const sections = useMemo(
    () =>
      group
        ? [
            { title: 'Kolay', items: getItemsByLevel(group.items, 1) },
            { title: 'Orta', items: getItemsByLevel(group.items, 2) },
            { title: 'Zor', items: getItemsByLevel(group.items, 3) },
          ]
        : [],
    [group]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>{'< Geri'}</Text>
          </Pressable>
          <Text style={styles.heading}>{route.params.groupName}</Text>
        </View>

        <Text style={styles.sub}>
          Asagidan bir alt senaryo sec. Mod olarak speaking veya writing belirleyebilirsin.
        </Text>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const disabled = state.status === 'signed_in' && !item.isUnlocked;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (disabled) return;
                    setSelectedScenarioId(item.id);
                  }}
                  style={[
                    styles.childCard,
                    { borderColor: getDifficultyColor(item.difficultyLevel) },
                    selectedScenarioId === item.id && styles.childCardSelected,
                    disabled && styles.childCardLocked,
                  ]}
                >
                  <View style={styles.childHeader}>
                    <Text style={styles.childTitle}>{item.name}</Text>
                    <Text style={styles.childBadge}>{getDifficultyLabel(item.difficultyLevel)}</Text>
                  </View>
                  <Text style={styles.childStatus}>
                    {state.status !== 'signed_in'
                      ? 'Katalog gorunumu'
                      : item.isCompleted
                        ? 'Tamamlandi'
                        : item.isUnlocked
                          ? 'Acik'
                          : 'Kilitli'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calisma tipi</Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setInteractionType(2)}
              style={[styles.modeCard, interactionType === 2 && styles.modeCardSelected]}
            >
              <Text style={styles.modeTitle}>Writing</Text>
              <Text style={styles.modeMeta}>Yazarak pratik</Text>
            </Pressable>
            <Pressable
              onPress={() => setInteractionType(1)}
              style={[styles.modeCard, interactionType === 1 && styles.modeCardSelected]}
            >
              <Text style={styles.modeTitle}>Speaking</Text>
              <Text style={styles.modeMeta}>Konusma odakli pratik</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mini ogrenme alanlari</Text>
          <View style={styles.gameList}>
            <Pressable
              onPress={() => {
                if (!selectedScenario) return;
                navigation.navigate('ScenarioDictionary', {
                  scenarioId: selectedScenario.id,
                  scenarioTitle: selectedScenario.name,
                  promptKey: selectedScenario.promptKey,
                  difficultyLevel: selectedScenario.difficultyLevel,
                  difficultyLabel: getDifficultyLabel(selectedScenario.difficultyLevel),
                });
              }}
              style={[styles.gameCard, !selectedScenario && styles.gameCardDisabled]}
            >
              <Text style={styles.gameTitle}>Dictionary</Text>
              <Text style={styles.gameMeta}>Senaryo kelimeleri, anlamlar ve ornekler</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!selectedScenario) return;
                navigation.navigate('SentenceBuilder', {
                  scenarioId: selectedScenario.id,
                  scenarioTitle: selectedScenario.name,
                  promptKey: selectedScenario.promptKey,
                  difficultyLevel: selectedScenario.difficultyLevel,
                  difficultyLabel: getDifficultyLabel(selectedScenario.difficultyLevel),
                });
              }}
              style={[styles.gameCard, !selectedScenario && styles.gameCardDisabled]}
            >
              <Text style={styles.gameTitle}>Sentence Builder</Text>
              <Text style={styles.gameMeta}>Cumleyi dogru siraya koy, sonra sesli dene</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!selectedScenario) return;
                navigation.navigate('WordMatching', {
                  scenarioId: selectedScenario.id,
                  scenarioTitle: selectedScenario.name,
                  promptKey: selectedScenario.promptKey,
                  difficultyLevel: selectedScenario.difficultyLevel,
                  difficultyLabel: getDifficultyLabel(selectedScenario.difficultyLevel),
                });
              }}
              style={[styles.gameCard, !selectedScenario && styles.gameCardDisabled]}
            >
              <Text style={styles.gameTitle}>Word Matching</Text>
              <Text style={styles.gameMeta}>Ingilizce kelimeleri Turkce anlamlariyla eslestir</Text>
            </Pressable>
          </View>
        </View>

        <PrimaryButton
          title={state.status === 'signed_in' ? 'Secili alt senaryoyu baslat' : 'Giris yaparak baslat'}
          disabled={state.status === 'signed_in' ? !selectedScenario : false}
          onPress={() => {
            if (state.status !== 'signed_in') {
              navigation.navigate('Login');
              return;
            }

            if (!selectedScenario) return;

            navigation.navigate('Chat', {
              scenarioId: selectedScenario.id,
              scenarioTitle: selectedScenario.name,
              difficultyLabel: getDifficultyLabel(selectedScenario.difficultyLevel),
              interactionType,
              interactionLabel: interactionType === 1 ? 'Speaking' : 'Writing',
            });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  error: { color: '#9B1C1C', marginBottom: 12 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  childCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  childCardSelected: {
    backgroundColor: '#E8F5F1',
  },
  childCardLocked: {
    opacity: 0.55,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  childTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  childBadge: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  childStatus: { marginTop: 6, fontSize: 13, color: colors.textSecondary },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F1',
  },
  modeTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  modeMeta: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  gameList: { gap: 10 },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  gameCardDisabled: { opacity: 0.5 },
  gameTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  gameMeta: { marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
