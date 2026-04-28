// src/screens/WelcomeScreen.js

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Shield Icon */}
        <Animated.View style={[styles.shieldWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.shieldOuter}>
            <View style={styles.shieldInner}>
              <Text style={styles.shieldIcon}>🛡️</Text>
            </View>
          </View>
        </Animated.View>

        {/* Brand */}
        <Text style={styles.appName}>Suraksha</Text>
        <Text style={styles.tagline}>Your Safety. Your Power.</Text>
        <Text style={styles.subtitle}>
          Women's safety app with SOS alerts, live location sharing, evidence recording, and more.
        </Text>

        {/* Features row */}
        <View style={styles.featRow}>
          {['🆘 SOS', '📍 Location', '🎙️ Record', '👥 Contacts'].map((f) => (
            <View key={f} style={styles.featPill}>
              <Text style={styles.featText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.btnWrap}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Free forever. No ads. Your data is encrypted and private.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -width * 0.3,
    left: -width * 0.1,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -width * 0.2,
    right: -width * 0.1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    width: '100%',
  },
  shieldWrap: { marginBottom: 20 },
  shieldOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldIcon: { fontSize: 38, fontFamily: FONT_FAMILY.regular },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 4,
    fontFamily: FONT_FAMILY.bold,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY.regular,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    fontFamily: FONT_FAMILY.regular,
  },
  featRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 36,
  },
  featPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featText: { color: COLORS.white, fontSize: 12, fontWeight: '500', fontFamily: FONT_FAMILY.regular },
  btnWrap: { width: '100%', gap: 12, marginBottom: 20 },
  btnPrimary: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.bold,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY.bold,
  },
  legal: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.regular,
  },
});
