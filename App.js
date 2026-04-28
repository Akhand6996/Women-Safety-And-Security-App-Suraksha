// App.js

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ensure splash screen is kept visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Roboto-Regular': require('./src/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Bold': require('./src/assets/fonts/Roboto-Bold.ttf'),
  });

  // Fonts load hone ke baad aur splash screen hide hone ke liye useEffect
  useEffect(() => {
    // Jab fonts load ho jaayen ya koi error aaye
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync(); // Splash screen ko hide karein
    }
  }, [fontsLoaded, fontError]);


  // Jab tak fonts load na hon aur koi error na ho, return null karein
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Agar fonts load hote waqt koi error aaya hai, toh error screen dikhayein
  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading fonts: {fontError.message}</Text>
        <Text style={styles.errorText}>Please check font file names and paths in App.js and src/assets/fonts/ folder.</Text>
      </View>
    );
  }

  // Fonts successfully load ho gaye hain, ab main app render karein
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});
