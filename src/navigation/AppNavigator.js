// src/navigation/AppNavigator.js

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

// Auth screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// App screens
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import EvidenceRecorderScreen from '../screens/EvidenceRecorderScreen';
import LocationShareScreen from '../screens/LocationShareScreen';
import SafetyMapScreen from '../screens/SafetyMapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FakeCallScreen from '../screens/FakeCallScreen';
import JourneyTrackerScreen from '../screens/JourneyTrackerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: '🏠', inactive: '🏠' },
  Contacts: { active: '👥', inactive: '👤' },
  Map: { active: '🗺️', inactive: '🗺' },
  Evidence: { active: '📹', inactive: '📷' },
  Profile: { active: '👤', inactive: '👤' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => (
          <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]?.active || '??'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarLabel: 'Contacts' }} />
      <Tab.Screen name="Map" component={SafetyMapScreen} options={{ tabBarLabel: 'Safety Map' }} />
      <Tab.Screen name="Evidence" component={EvidenceRecorderScreen} options={{ tabBarLabel: 'Evidence' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="LocationShare" component={LocationShareScreen} />
      <Stack.Screen name="FakeCall" component={FakeCallScreen} />
      <Stack.Screen name="JourneyTracker" component={JourneyTrackerScreen} />
      <Stack.Screen name="EvidenceRecorder" component={EvidenceRecorderScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <Text style={{ fontSize: 40 }}>??</Text>
        <ActivityIndicator color={COLORS.white} size="large" style={{ marginTop: 20 }} />
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 12, fontSize: 14 }}>Loading Suraksha...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
