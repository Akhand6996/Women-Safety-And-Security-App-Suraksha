// src/screens/FakeCallScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, StatusBar, Vibration, Linking,
} from 'react-native';
import { sosService } from '../services/sosService';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function FakeCallScreen() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callerName, setCallerName] = useState('Mom');
  const [callDuration, setCallDuration] = useState(0);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      setTimer(interval);
    } else {
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallActive]);

  const startFakeCall = (name) => {
    setCallerName(name);
    setIsCallActive(true);
    Vibration.vibrate([0, 500, 200, 500]);
  };

  const endCall = () => {
    setIsCallActive(false);
    Alert.alert('Call Ended', 'Fake call has been ended');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CallButton = ({ name, icon, color }) => (
    <TouchableOpacity
      style={[styles.callButton, { backgroundColor: color + '15', borderColor: color }]}
      onPress={() => startFakeCall(name)}
      disabled={isCallActive}
    >
      <Text style={[styles.callButtonIcon, { color }]}>{icon}</Text>
      <Text style={[styles.callButtonText, { color }]}>{name}</Text>
    </TouchableOpacity>
  );

  if (isCallActive) {
    return (
      <View style={styles.callScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <View style={styles.callHeader}>
          <Text style={styles.callingText}>Calling...</Text>
        </View>

        <View style={styles.callerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{callerName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callStatus}>Fake Call</Text>
        </View>

        <View style={styles.callTimer}>
          <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
        </View>

        <View style={styles.callActions}>
          <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
            <Text style={styles.endCallBtnText}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Fake Call</Text>
        <Text style={styles.subtitle}>Get out of uncomfortable situations</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How It Works</Text>
        <Text style={styles.infoText}>
          Start a fake call to get out of uncomfortable or dangerous situations.
          The call will look and sound real to help you leave safely.
        </Text>
      </View>

      <View style={styles.callOptions}>
        <Text style={styles.optionsTitle}>Choose Caller</Text>
        <View style={styles.callButtons}>
          <CallButton name="Mom" icon="👩" color={COLORS.primary} />
          <CallButton name="Dad" icon="👨" color={COLORS.info} />
          <CallButton name="Friend" icon="👫" color={COLORS.success} />
          <CallButton name="Boss" icon="💼" color={COLORS.warning} />
          <CallButton name="Police" icon="👮" color={COLORS.danger} />
          <CallButton name="Emergency" icon="🆘" color="#FF6B35" />
        </View>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Features</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Realistic call interface</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⏱️</Text>
            <Text style={styles.featureText}>Timer with duration display</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📳</Text>
            <Text style={styles.featureText}>Vibration feedback</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Multiple caller options</Text>
          </View>
        </View>
      </View>

      <View style={styles.safetyTips}>
        <Text style={styles.tipsTitle}>Safety Tips</Text>
        <Text style={styles.tipsText}>
          Use fake calls to:
        </Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>🚫 Avoid unwanted conversations</Text>
          <Text style={styles.tipItem}>🚪 Exit uncomfortable situations</Text>
          <Text style={styles.tipItem}>🏃 Create opportunities to leave</Text>
          <Text style={styles.tipItem}>🆘 Signal for help discreetly</Text>
        </View>
      </View>

      <View style={styles.emergencySection}>
        <TouchableOpacity 
          style={styles.emergencyBtn}
          onPress={() => Linking.openURL('tel:1091')}
        >
          <Text style={styles.emergencyBtnText}>🚨 Call Real Emergency (1091)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoSection: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  callOptions: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  callButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  callButton: {
    width: '48%',
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  callButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  callButtonText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  features: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  safetyTips: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: 16,
  },
  emergencySection: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  emergencyBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  emergencyBtnText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  // Call Screen Styles
  callScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  callHeader: {
    alignItems: 'center',
    paddingTop: 80,
  },
  callingText: {
    fontSize: SIZES.md,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
  },
  callerName: {
    fontSize: SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  callStatus: {
    fontSize: SIZES.md,
    color: 'rgba(255,255,255,0.7)',
  },
  callTimer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  timerText: {
    fontSize: SIZES.xxxl,
    fontWeight: '300',
    color: COLORS.white,
  },
  callActions: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  endCallBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallBtnText: {
    fontSize: 32,
    color: COLORS.white,
  },
});
