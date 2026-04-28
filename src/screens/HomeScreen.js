// src/screens/HomeScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, ScrollView, Vibration, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { sosService } from '../services/sosService';
import { sensorService } from '../services/sensorService';
import { locationService } from '../services/locationService';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

const COUNTDOWN_SECONDS = 5;

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [location, setLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    locationService.getCurrentLocation()
      .then(setLocation)
      .catch(() => {});

    sensorService.startMonitoring(handleSensorDanger);
    return () => sensorService.stopMonitoring();
  }, []);

  useEffect(() => {
    if (sosActive) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
    }
  }, [sosActive]);

  const handleSensorDanger = (danger) => {
    if (danger.type === 'FALL_DETECTED' || danger.type === 'SHAKE_DETECTED') {
      Alert.alert(
        'Danger Detected!',
        danger.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Trigger SOS', onPress: () => triggerSOS(true), style: 'destructive' }
        ]
      );
    }
  };

  const triggerSOS = async (instant = false) => {
    if (sosActive) return;

    if (!instant) {
      let count = COUNTDOWN_SECONDS;
      setCountdown(count);
      setStatusMsg('Cancel to stop SOS...');

      countdownRef.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownRef.current);
          executeSOS();
        }
      }, 1000);

      return;
    }

    executeSOS();
  };

  const executeSOS = async () => {
    try {
      setCountdown(null);
      const contacts = profile?.emergencyContacts || [];
      
      await sosService.triggerSOS(contacts, (msg) => {
        setStatusMsg(msg);
      });

      setSosActive(true);
      setStatusMsg('SOS ACTIVE ');
      Vibration.vibrate('pattern');
    } catch (err) {
      Alert.alert('SOS Failed', 'Could not trigger SOS. Please try again.');
      resetSOS();
    }
  };

  const cancelSOS = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      setCountdown(null);
      setStatusMsg('');
      return;
    }

    try {
      await sosService.cancelSOS((msg) => {
        setStatusMsg(msg);
      });
      setSosActive(false);
      setStatusMsg('');
    } catch (err) {
      console.error('Cancel SOS error:', err);
    }
  };

  const resetSOS = () => {
    setSosActive(false);
    setCountdown(null);
    setStatusMsg('');
  };

  const QuickAction = ({ icon, label, onPress, color = COLORS.primary }) => (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: color + '15' }]} onPress={onPress}>
      <Text style={[styles.quickActionIcon, { color }, { fontFamily: FONT_FAMILY.regular }]}>{icon}</Text>
      <Text style={[styles.quickActionLabel, { fontFamily: FONT_FAMILY.regular }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { fontFamily: FONT_FAMILY.regular }]}>Hi, {profile?.name || user?.displayName || 'User'}</Text>
          <Text style={[styles.subtitle, { fontFamily: FONT_FAMILY.regular }]}>Stay safe, stay connected</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
          <Text style={[styles.profileIcon, { fontFamily: FONT_FAMILY.regular }]}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* SOS Button Area */}
      <View style={styles.sosSection}>
        <Animated.View style={[styles.sosButtonWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={sosActive ? cancelSOS : triggerSOS}
            activeOpacity={0.8}
          >
            <Text style={[styles.sosButtonText, sosActive && styles.sosButtonTextActive, { fontFamily: FONT_FAMILY.bold }]}>
              {sosActive ? 'CANCEL SOS' : countdown ? `${countdown}` : 'SOS'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {statusMsg ? (
          <Text style={[styles.statusMsg, sosActive && styles.statusMsgActive, { fontFamily: FONT_FAMILY.regular }]}>
            {statusMsg}
          </Text>
        ) : null}

        {!sosActive && (
          <View style={styles.sosHints}>
            <Text style={[styles.hintText, { fontFamily: FONT_FAMILY.regular }]}>Press for 5-second countdown</Text>
            <Text style={[styles.hintText, { fontFamily: FONT_FAMILY.regular }]}>Long press for instant SOS</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <ScrollView style={styles.quickActions} showsVerticalScrollIndicator={false}>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="👥"
            label="Emergency Contacts"
            onPress={() => navigation.navigate('Contacts')}
          />
          <QuickAction
            icon="📍"
            label="Live Location"
            onPress={() => navigation.navigate('LocationShare')}
          />
          <QuickAction
            icon="📹"
            label="Evidence"
            onPress={() => navigation.navigate('EvidenceRecorder')}
          />
          <QuickAction
            icon="🗺️"
            label="Safety Map"
            onPress={() => navigation.navigate('Map')}
            color={COLORS.info}
          />
          <QuickAction
            icon="🛣️"
            label="Journey Tracker"
            onPress={() => navigation.navigate('JourneyTracker')}
            color={COLORS.warning}
          />
          <QuickAction
            icon="📞"
            label="Fake Call"
            onPress={() => navigation.navigate('FakeCall')}
            color={COLORS.success}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  sosSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sosButtonWrap: {
    marginBottom: 20,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  sosButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  sosButtonTextActive: {
    fontSize: 24,
  },
  statusMsg: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  statusMsgActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sosHints: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  quickActions: {
    flex: 1,
    paddingHorizontal: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  quickAction: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
