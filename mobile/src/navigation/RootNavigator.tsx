import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PlacementScreen } from '../screens/PlacementScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { MistakesScreen } from '../screens/MistakesScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/AuthContext';

enableScreens(false);

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { state } = useAuth();
  const initialRouteName: keyof RootStackParamList =
    state.status === 'signed_in' ? 'Placement' : 'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator
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
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Mistakes" component={MistakesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
