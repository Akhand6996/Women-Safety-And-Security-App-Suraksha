// src/screens/JourneyTrackerScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ScrollView, StatusBar, Animated,
} from 'react-native';
import { locationService } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function JourneyTrackerScreen({ navigation }) {
  const { profile } = useAuth();
  const [phase, setPhase] = useState('setup'); // setup | active | arrived
  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState('30');
  const [elapsed, setElapsed] = useState(0);
  const [location, setLocation] = useState(null);
  const [journeyId, setJourneyId] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      clearInterval(timerRef.current);
      pulseAnim.setValue(1);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startJourney = async () => {
    if (!destination.trim()) {
      Alert.alert('Enter Destination', 'Where are you going?');
      return;
    }
    const contacts = profile?.emergencyContacts || [];
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Add emergency contacts first so they can track your journey.');
      return;
    }
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
      const id = await locationService.startJourney(destination, contacts, (l) => {
        setLocation({ coords: l });
      });
      setJourneyId(id);
      setPhase('active');
      setElapsed(0);

      Alert.alert(
        'Journey Started 🧭',
        `Your ${contacts.length} contact(s) have been notified. They will be alerted if you stop unexpectedly or don't arrive within ${eta} minutes.`
      );
    } catch (err) {
      Alert.alert('Error', 'Could not start journey: ' + err.message);
    }
  };

  const markArrived = async () => {
    await locationService.stopJourney();
    setPhase('arrived');
    clearInterval(timerRef.current);

    Alert.alert(
      'Arrived Safely ✅',
      'Your contacts have been notified that you arrived safely.',
      [{ text: 'Great!', onPress: () => { setPhase('setup'); setDestination(''); setElapsed(0); } }]
    );
  };

  const cancelJourney = () => {
    Alert.alert(
      'Cancel Journey?',
      'Your contacts will be notified that the journey was cancelled.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Journey', style: 'destructive',
          onPress: async () => {
            await locationService.stopJourney();
            setPhase('setup');
            clearInterval(timerRef.current);
            setElapsed(0);
          },
        },
      ]
    );
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const etaMs = parseInt(eta) * 60;
  const overdue = elapsed > etaMs;
  const progressPct = Math.min((elapsed / etaMs) * 100, 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Journey Tracker</Text>
        <Text style={styles.subtitle}>Your contacts watch over you until you arrive safely</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {phase === 'setup' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🧭</Text>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Enter your destination and estimated travel time. Your emergency contacts will be
                notified if you stop unexpectedly, deviate from your route, or don't mark yourself
                as arrived within the time limit.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Going to</Text>
              <TextInput
                style={styles.textInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Home, Office, Priya's house..."
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Estimated travel time</Text>
              <View style={styles.etaRow}>
                {['10', '15', '20', '30', '45', '60', '90'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.etaChip, eta === t && styles.etaChipActive]}
                    onPress={() => setEta(t)}
                  >
                    <Text style={[styles.etaChipText, eta === t && styles.etaChipTextActive]}>
                      {t >= 60 ? `${t / 60}h` : `${t}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Alerting contacts</Text>
              <View style={styles.contactsPreview}>
                {(profile?.emergencyContacts || []).slice(0, 3).map((c) => (
                  <View key={c.id} style={styles.contactPill}>
                    <Text style={styles.contactPillText}>{c.name}</Text>
                  </View>
                ))}
                {!profile?.emergencyContacts?.length && (
                  <Text style={styles.noContactsText}>⚠️ No contacts added yet</Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startJourney}>
              <Text style={styles.startBtnText}>🧭 Start Journey</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'active' && (
          <>
            <Animated.View style={[styles.activeCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.activeDotRow}>
                <View style={styles.activeDot} />
                <Text style={styles.activeStatus}>JOURNEY ACTIVE</Text>
              </View>
              <Text style={styles.destText}>→ {destination}</Text>
              <Text style={[styles.elapsedText, overdue && styles.elapsedOverdue]}>
                {formatTime(elapsed)} elapsed
              </Text>
              {overdue && (
                <Text style={styles.overdueWarning}>
                  ⚠️ You've exceeded your estimated time — contacts may have been alerted
                </Text>
              )}
            </Animated.View>

            {/* Progress bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Journey progress</Text>
                <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[
                  styles.progressFill,
                  { width: `${progressPct}%` },
                  overdue && styles.progressFillOverdue,
                ]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressFooterText}>Start</Text>
                <Text style={styles.progressFooterText}>ETA {eta} min</Text>
              </View>
            </View>

            {/* Location card */}
            {location && (
              <View style={styles.locationCard}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationTitle}>Live location active</Text>
                  <Text style={styles.locationCoords}>
                    {location.coords.latitude?.toFixed(4)}, {location.coords.longitude?.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.locationLiveBadge}>
                  <Text style={styles.locationLiveDot}>●</Text>
                  <Text style={styles.locationLiveText}>LIVE</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.arrivedBtn} onPress={markArrived}>
              <Text style={styles.arrivedBtnText}>✅ I Arrived Safely</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={cancelJourney}>
              <Text style={styles.cancelBtnText}>Cancel Journey</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.accent, padding: 20, paddingTop: 52 },
  backArrow: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 16, gap: 14 },

  infoCard: {
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#C0DD97',
  },
  infoIcon: { fontSize: 32 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  infoText: { fontSize: 13, color: '#27500A', lineHeight: 19, textAlign: 'center' },

  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 16,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  textInput: {
    height: 48, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14,
    fontSize: 15, color: COLORS.text,
  },
  etaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  etaChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  etaChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  etaChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  etaChipTextActive: { color: COLORS.white },
  contactsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  contactPill: {
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  contactPillText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  noContactsText: { fontSize: 13, color: COLORS.warning },

  startBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center',
  },
  startBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  activeCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.primary,
    padding: 20, alignItems: 'center', gap: 8,
  },
  activeDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  activeStatus: { fontSize: 13, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  destText: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  elapsedText: { fontSize: 28, fontWeight: '800', color: COLORS.primaryDark, fontVariant: ['tabular-nums'] },
  elapsedOverdue: { color: COLORS.primary },
  overdueWarning: { fontSize: 12, color: COLORS.primary, textAlign: 'center', fontWeight: '500' },

  progressCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
  progressTrack: { height: 10, backgroundColor: COLORS.surfaceAlt, borderRadius: 5 },
  progressFill: { height: 10, backgroundColor: COLORS.accent, borderRadius: 5 },
  progressFillOverdue: { backgroundColor: COLORS.primary },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressFooterText: { fontSize: 10, color: COLORS.textMuted },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: 12, borderWidth: 1, borderColor: '#B5D4F4',
  },
  locationIcon: { fontSize: 22 },
  locationTitle: { fontSize: 13, fontWeight: '600', color: COLORS.police },
  locationCoords: { fontSize: 11, color: COLORS.police, fontFamily: 'monospace' },
  locationLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationLiveDot: { fontSize: 10, color: COLORS.primary },
  locationLiveText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },

  arrivedBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center',
  },
  arrivedBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
