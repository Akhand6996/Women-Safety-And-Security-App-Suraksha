// src/screens/FakeCallScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Vibration, StatusBar,
} from 'react-native';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

const CALLERS = [
  { name: 'Mom', avatar: '👩', relation: 'Mother' },
  { name: 'Dad', avatar: '👨', relation: 'Father' },
  { name: 'Sister', avatar: '👧', relation: 'Sister' },
  { name: 'Police Officer', avatar: '👮', relation: 'Authority' },
  { name: 'Dr. Sharma', avatar: '👨‍⚕️', relation: 'Doctor' },
  { name: 'Boss (Office)', avatar: '💼', relation: 'Work' },
];

export default function FakeCallScreen({ navigation }) {
  const [phase, setPhase] = useState('setup'); // setup | ringing | active | ended
  const [selectedCaller, setSelectedCaller] = useState(CALLERS[0]);
  const [delay, setDelay] = useState(5);
  const [callDuration, setCallDuration] = useState(0);
  const ringAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'ringing') {
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Vibration.cancel();
      ringAnim.setValue(1);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startFakeCall = () => {
    setPhase('ringing');
    // Auto-ring after delay
    setTimeout(() => {
      if (phase !== 'ended') setPhase('ringing');
    }, delay * 1000);
  };

  const scheduleCall = () => {
    setPhase('setup');
    setTimeout(() => {
      setPhase('ringing');
    }, delay * 1000);
  };

  const answerCall = () => {
    setPhase('active');
    setCallDuration(0);
  };

  const endCall = () => {
    setPhase('ended');
    clearInterval(timerRef.current);
    setTimeout(() => {
      setPhase('setup');
      setCallDuration(0);
    }, 2000);
  };

  const declineCall = () => {
    setPhase('setup');
    Vibration.cancel();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (phase === 'ringing') return (
    <View style={styles.callScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      <Text style={styles.callScreenTitle}>Incoming Call</Text>
      <Text style={styles.callScreenSub}>{selectedCaller.relation}</Text>

      <Animated.View style={[styles.callerAvatarWrap, { transform: [{ scale: ringAnim }] }]}>
        <View style={styles.callerAvatar}>
          <Text style={styles.callerAvatarIcon}>{selectedCaller.avatar}</Text>
        </View>
      </Animated.View>

      <Text style={styles.callerName}>{selectedCaller.name}</Text>
      <Text style={styles.callerNumber}>+91 98765 43210</Text>
      <Text style={styles.ringingText}>Ringing...</Text>

      <View style={styles.callBtnsRow}>
        <TouchableOpacity style={[styles.callCircleBtn, styles.declineBtn]} onPress={declineCall}>
          <Text style={styles.callCircleBtnIcon}>📵</Text>
          <Text style={styles.callCircleBtnLabel}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callCircleBtn, styles.answerBtn]} onPress={answerCall}>
          <Text style={styles.callCircleBtnIcon}>📞</Text>
          <Text style={styles.callCircleBtnLabel}>Answer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (phase === 'active') return (
    <View style={styles.callScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      <Text style={styles.callScreenTitle}>On Call</Text>
      <Text style={styles.callDuration}>{formatTime(callDuration)}</Text>

      <View style={styles.callerAvatar}>
        <Text style={styles.callerAvatarIcon}>{selectedCaller.avatar}</Text>
      </View>

      <Text style={styles.callerName}>{selectedCaller.name}</Text>
      <Text style={styles.callerNumber}>+91 98765 43210</Text>

      <View style={styles.activeBtnsGrid}>
        {['🔇 Mute', '🔊 Speaker', '🎤 Unmute', '⌨️ Keypad'].map((b) => (
          <TouchableOpacity key={b} style={styles.activeBtn}>
            <Text style={styles.activeBtnText}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.callCircleBtn, styles.declineBtn, { marginTop: 20 }]} onPress={endCall}>
        <Text style={styles.callCircleBtnIcon}>📵</Text>
        <Text style={styles.callCircleBtnLabel}>End</Text>
      </TouchableOpacity>
    </View>
  );

  if (phase === 'ended') return (
    <View style={styles.callScreen}>
      <Text style={styles.callerName}>Call Ended</Text>
      <Text style={styles.callDuration}>{formatTime(callDuration)}</Text>
    </View>
  );

  // Setup screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fake Call</Text>
        <Text style={styles.subtitle}>Simulate an incoming call to escape safely</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Choose caller</Text>
        <View style={styles.callersGrid}>
          {CALLERS.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[styles.callerChip, selectedCaller.name === c.name && styles.callerChipActive]}
              onPress={() => setSelectedCaller(c)}
            >
              <Text style={styles.callerChipIcon}>{c.avatar}</Text>
              <Text style={[styles.callerChipText, selectedCaller.name === c.name && styles.callerChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Ring after</Text>
        <View style={styles.delayRow}>
          {[3, 5, 10, 15, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.delayChip, delay === d && styles.delayChipActive]}
              onPress={() => setDelay(d)}
            >
              <Text style={[styles.delayText, delay === d && styles.delayTextActive]}>{d}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            💡 Tip: Set a short delay (3–5s), then put your phone away. The "call" will ring — excuse yourself naturally.
          </Text>
        </View>

        <TouchableOpacity style={styles.ringNowBtn} onPress={startFakeCall}>
          <Text style={styles.ringNowText}>📞 Ring Immediately</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleBtn} onPress={scheduleCall}>
          <Text style={styles.scheduleBtnText}>⏱ Ring in {delay} seconds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primaryDark, padding: 20, paddingTop: 52 },
  backArrow: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { padding: 20, gap: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  callersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  callerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  callerChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  callerChipIcon: { fontSize: 16 },
  callerChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  callerChipTextActive: { color: COLORS.primary },
  delayRow: { flexDirection: 'row', gap: 8 },
  delayChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  delayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  delayText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  delayTextActive: { color: COLORS.white },
  infoBanner: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: 12, borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  infoText: { fontSize: 12, color: COLORS.warning, lineHeight: 18 },
  ringNowBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 16, alignItems: 'center' },
  ringNowText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  scheduleBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  scheduleBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },

  // Call UI
  callScreen: {
    flex: 1, backgroundColor: '#1C1C1E',
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  callScreenTitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  callScreenSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  callerAvatarWrap: { marginVertical: 8 },
  callerAvatar: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center',
  },
  callerAvatarIcon: { fontSize: 52 },
  callerName: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  callerNumber: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  ringingText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  callDuration: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' },
  callBtnsRow: { flexDirection: 'row', gap: 60, marginTop: 20 },
  callCircleBtn: { alignItems: 'center', gap: 8 },
  callCircleBtnIcon: { fontSize: 24, padding: 20, borderRadius: 40, overflow: 'hidden' },
  callCircleBtnLabel: { fontSize: 12, color: COLORS.white },
  declineBtn: {},
  answerBtn: {},
  activeBtnsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 20 },
  activeBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#2C2C2E', borderRadius: RADIUS.md,
  },
  activeBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '500' },
});
