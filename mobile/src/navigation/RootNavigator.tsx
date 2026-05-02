import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useAuth } from '../auth/AuthContext';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MistakesScreen } from '../screens/MistakesScreen';
import { PlacementScreen } from '../screens/PlacementScreen';
import { PronunciationPracticeScreen } from '../screens/PronunciationPracticeScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ScenarioGroupScreen } from '../screens/ScenarioGroupScreen';
import { ScenarioDictionaryScreen } from '../screens/ScenarioDictionaryScreen';
import { SentenceBuilderScreen } from '../screens/SentenceBuilderScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { WordMatchingScreen } from '../screens/WordMatchingScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

enableScreens(true);

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList =
    state.status === 'signed_in'
      ? state.user.currentLevel
        ? 'Home'
        : 'Placement'
      : 'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRouteName}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Placement" component={PlacementScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ScenarioGroup" component={ScenarioGroupScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Mistakes" component={MistakesScreen} />
        <Stack.Screen name="ScenarioDictionary" component={ScenarioDictionaryScreen} />
        <Stack.Screen name="SentenceBuilder" component={SentenceBuilderScreen} />
        <Stack.Screen name="WordMatching" component={WordMatchingScreen} />
        <Stack.Screen name="PronunciationPractice" component={PronunciationPracticeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
