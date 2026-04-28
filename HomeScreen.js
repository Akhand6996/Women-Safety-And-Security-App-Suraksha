// src/screens/HomeScreen.js
// Main screen with giant SOS button, status indicators, quick actions

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

  // Get initial location and start passive sensor monitoring
  useEffect(() => {
    locationService.getCurrentLocation()
      .then(setLocation)
      .catch(() => {});

    sensorService.startMonitoring(handleSensorDanger);
    return () => sensorService.stopMonitoring();
  }, []);

  // SOS pulse animation
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
      pulseAnim.setValue(1);
    }
  }, [sosActive]);

  // Sensor-triggered danger
  const handleSensorDanger = (event) => {
    Alert.alert(
      '⚠️ Danger Detected',
      event.message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Trigger SOS Now', onPress: () => startSOSCountdown(), style: 'destructive' },
      ]
    );
  };

  // ── SOS COUNTDOWN ────────────────────────────────────────────────
  const startSOSCountdown = () => {
    if (sosActive) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Vibration.vibrate([0, 200, 100, 200]);

    let count = COUNTDOWN_SECONDS;
    setCountdown(count);

    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        triggerSOS();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownRef.current);
    setCountdown(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── TRIGGER SOS ─────────────────────────────────────────────────
  const triggerSOS = async () => {
    const contacts = profile?.emergencyContacts || [];
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add at least one emergency contact before using SOS.',
        [
          { text: 'Add Now', onPress: () => navigation.navigate('Contacts') },
          { text: 'Continue Anyway', onPress: () => doSOS([]) },
        ]
      );
      return;
    }
    doSOS(contacts);
  };

  const doSOS = async (contacts) => {
    setSosActive(true);
    Vibration.vibrate([0, 500, 200, 500, 200, 1000]);
    try {
      await sosService.triggerSOS(contacts, setStatusMsg);
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    }
  };

  // ── CANCEL SOS ──────────────────────────────────────────────────
  const cancelSOS = () => {
    Alert.alert(
      'Cancel SOS?',
      'Are you safe? This will stop alerts and recording.',
      [
        { text: 'Keep SOS Active', style: 'cancel' },
        {
          text: "I'm Safe — Cancel SOS",
          style: 'destructive',
          onPress: async () => {
            await sosService.cancelSOS(setStatusMsg);
            setSosActive(false);
            setStatusMsg('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const quickActions = [
    { id: 'record', icon: '🎙️', label: 'Record Evidence', color: COLORS.primaryLight, textColor: COLORS.primaryDark, onPress: () => navigation.navigate('EvidenceRecorder') },
    { id: 'location', icon: '📍', label: 'Share Location', color: COLORS.infoLight, textColor: COLORS.police, onPress: () => navigation.navigate('LocationShare') },
    { id: 'journey', icon: '🧭', label: 'Journey Tracker', color: COLORS.successLight, textColor: COLORS.accent, onPress: () => navigation.navigate('JourneyTracker') },
    { id: 'fake', icon: '📞', label: 'Fake Call', color: COLORS.warningLight, textColor: COLORS.warning, onPress: () => navigation.navigate('FakeCall') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName?.split(' ')[0] || 'Stay Safe'} 👋</Text>
          <Text style={styles.headerSub}>
            {location ? '📍 Location active' : '⚠️ Enable location'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.displayName || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* SOS Zone */}
        <View style={styles.sosZone}>

          {/* Status message during SOS */}
          {statusMsg ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>⚡ {statusMsg}</Text>
            </View>
          ) : null}

          {/* Countdown overlay */}
          {countdown !== null && (
            <View style={styles.countdownWrap}>
              <Text style={styles.countdownLabel}>SOS in...</Text>
              <Text style={styles.countdownNum}>{countdown}</Text>
              <TouchableOpacity style={styles.cancelCountdownBtn} onPress={cancelCountdown}>
                <Text style={styles.cancelCountdownText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* The SOS Button */}
          <Animated.View style={[styles.sosRingOuter, sosActive && styles.sosRingActive, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.sosRingInner, sosActive && styles.sosRingInnerActive]}>
              <TouchableOpacity
                style={[styles.sosBtn, sosActive && styles.sosBtnActive]}
                onPress={sosActive ? cancelSOS : startSOSCountdown}
                onLongPress={triggerSOS}
                delayLongPress={0}
                activeOpacity={0.85}
              >
                <Text style={styles.sosLabel}>{sosActive ? '✕' : 'SOS'}</Text>
                <Text style={styles.sosSub}>
                  {sosActive ? 'Tap to cancel' : 'Tap or hold'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Text style={styles.sosHint}>
            {sosActive
              ? '🔴 SOS ACTIVE — Recording & alerting contacts'
              : 'Tap to start 5-sec countdown • Hold to trigger instantly'}
          </Text>
        </View>

        {/* Status chips */}
        <View style={styles.chipsRow}>
          {[
            { label: 'Sensor Guard', value: 'Active', icon: '🤖', color: COLORS.successLight, tColor: COLORS.accent },
            { label: 'Location', value: location ? 'On' : 'Off', icon: '📍', color: location ? COLORS.successLight : COLORS.primaryLight, tColor: location ? COLORS.accent : COLORS.primary },
            { label: 'Contacts', value: `${profile?.emergencyContacts?.length || 0} saved`, icon: '👥', color: COLORS.infoLight, tColor: COLORS.police },
          ].map((chip) => (
            <View key={chip.label} style={[styles.chip, { backgroundColor: chip.color }]}>
              <Text style={styles.chipIcon}>{chip.icon}</Text>
              <Text style={[styles.chipValue, { color: chip.tColor }]}>{chip.value}</Text>
              <Text style={styles.chipLabel}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.quickBtn, { backgroundColor: a.color }]}
              onPress={a.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{a.icon}</Text>
              <Text style={[styles.quickLabel, { color: a.textColor }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Numbers */}
        <Text style={styles.sectionTitle}>Emergency Numbers</Text>
        <View style={styles.numbersCard}>
          {[
            { name: 'Women Helpline', number: '1091', icon: '👩' },
            { name: 'Police', number: '100', icon: '🚔' },
            { name: 'National Emergency', number: '112', icon: '🆘' },
            { name: 'Ambulance', number: '108', icon: '🚑' },
          ].map((e) => (
            <TouchableOpacity key={e.number} style={styles.numberRow}>
              <Text style={styles.numberIcon}>{e.icon}</Text>
              <View style={styles.numberInfo}>
                <Text style={styles.numberName}>{e.name}</Text>
                <Text style={styles.numberVal}>{e.number}</Text>
              </View>
              <View style={styles.callBtn}>
                <Text style={styles.callBtnText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: COLORS.white, fontFamily: FONT_FAMILY.bold },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONT_FAMILY.regular },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white, fontFamily: FONT_FAMILY.bold },

  sosZone: { alignItems: 'center', paddingVertical: 28, position: 'relative' },
  statusBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 16, maxWidth: '80%',
  },
  statusBannerText: { fontSize: 12, color: COLORS.primary, fontWeight: '500', textAlign: 'center', fontFamily: FONT_FAMILY.regular },

  countdownWrap: {
    alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg, padding: 20,
  },
  countdownLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 4, fontFamily: FONT_FAMILY.regular },
  countdownNum: { fontSize: 56, fontWeight: '800', color: COLORS.primary, lineHeight: 60, fontFamily: FONT_FAMILY.bold },
  cancelCountdownBtn: {
    marginTop: 10, backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  cancelCountdownText: { fontSize: 14, color: COLORS.primary, fontWeight: '700', fontFamily: FONT_FAMILY.bold },

  sosRingOuter: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(192,21,62,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosRingActive: { backgroundColor: 'rgba(192,21,62,0.15)' },
  sosRingInner: {
    width: 172, height: 172, borderRadius: 86,
    backgroundColor: 'rgba(192,21,62,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosRingInnerActive: { backgroundColor: 'rgba(192,21,62,0.2)' },
  sosBtn: {
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  sosBtnActive: { backgroundColor: COLORS.primaryDark },
  sosLabel: { fontSize: 36, fontWeight: '800', color: COLORS.white, letterSpacing: 2, fontFamily: FONT_FAMILY.bold },
  sosSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500', fontFamily: FONT_FAMILY.regular },
  sosHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 14, textAlign: 'center', paddingHorizontal: 32, fontFamily: FONT_FAMILY.regular },

  chipsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  chip: {
    flex: 1, borderRadius: RADIUS.md, padding: 10,
    alignItems: 'center', gap: 2,
  },
  chipIcon: { fontSize: 16, fontFamily: FONT_FAMILY.regular },
  chipValue: { fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bold },
  chipLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center', fontFamily: FONT_FAMILY.regular },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, paddingHorizontal: 20, marginBottom: 10, letterSpacing: 0.5, fontFamily: FONT_FAMILY.bold },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  quickBtn: { width: '47%', borderRadius: RADIUS.lg, padding: 16, gap: 8 },
  quickIcon: { fontSize: 24, fontFamily: FONT_FAMILY.regular },
  quickLabel: { fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.regular },

  numbersCard: { marginHorizontal: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 },
  numberRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  numberIcon: { fontSize: 20, width: 36, fontFamily: FONT_FAMILY.regular },
  numberInfo: { flex: 1 },
  numberName: { fontSize: 13, fontWeight: '600', color: COLORS.text, fontFamily: FONT_FAMILY.regular },
  numberVal: { fontSize: 16, fontWeight: '800', color: COLORS.primary, fontFamily: FONT_FAMILY.bold },
  callBtn: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6 },
  callBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, fontFamily: FONT_FAMILY.bold },
});
