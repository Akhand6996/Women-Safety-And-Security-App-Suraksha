// src/screens/LocationShareScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Alert, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { locationService } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function LocationShareScreen() {
  const { profile } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journeyActive, setJourneyActive] = useState(false);
  const [destination, setDestination] = useState('');

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
    } catch {
      Alert.alert('Location Error', 'Could not get your location. Please enable location services.');
    } finally {
      setLoading(false);
    }
  };

  const shareLocation = async () => {
    if (!location) return;
    const { latitude, longitude } = location.coords;
    const url = locationService.getShareableLink(latitude, longitude, 'My Live Location');
    const accuracy = Math.round(location.coords.accuracy);
    const time = new Date().toLocaleTimeString();

    await Share.share({
      message:
        `📍 My current location (Suraksha Safety App)\n\n` +
        `${url}\n\n` +
        `Accuracy: ±${accuracy}m | Time: ${time}\n\n` +
        `I am sharing this location for my safety.`,
      title: 'My Live Location — Suraksha',
    });
  };

  const shareWithAllContacts = async () => {
    const contacts = profile?.emergencyContacts || [];
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first.');
      return;
    }
    Alert.alert(
      'Share Location',
      `Send your live location to all ${contacts.length} emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send to All', onPress: shareLocation },
      ]
    );
  };

  const startJourney = async () => {
    if (!destination.trim()) {
      Alert.alert('Enter Destination', 'Please enter where you are going.');
      return;
    }
    try {
      const id = await locationService.startJourney(
        destination,
        profile?.emergencyContacts || [],
        (loc) => setLocation({ coords: loc })
      );
      setJourneyActive(true);
      Alert.alert('Journey Started', `Your contacts will be notified if you deviate from your route or stop unexpectedly.`);
    } catch {
      Alert.alert('Error', 'Could not start journey tracker.');
    }
  };

  const stopJourney = async () => {
    await locationService.stopJourney();
    setJourneyActive(false);
    Alert.alert("Journey Ended", "Your contacts have been notified that you arrived safely.");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.police} />

      <View style={styles.header}>
        <Text style={styles.title}>Location & Journey</Text>
        <Text style={styles.subtitle}>Share your real-time location with trusted contacts</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          {/* Map */}
          {location && (
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="Your Location"
                  description="You are here"
                  pinColor={COLORS.primary}
                />
                <Circle
                  center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                  radius={location.coords.accuracy || 50}
                  strokeColor="rgba(192,21,62,0.4)"
                  fillColor="rgba(192,21,62,0.1)"
                />
              </MapView>

              <View style={styles.coordsBox}>
                <Text style={styles.coordsText}>
                  {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
                  {' '}· ±{Math.round(location.coords.accuracy || 0)}m
                </Text>
              </View>
            </View>
          )}

          {/* Share buttons */}
          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareLocation}>
              <Text style={styles.shareBtnIcon}>📤</Text>
              <Text style={styles.shareBtnText}>Share Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, styles.shareBtnAlt]} onPress={shareWithAllContacts}>
              <Text style={styles.shareBtnIcon}>👥</Text>
              <Text style={[styles.shareBtnText, { color: COLORS.white }]}>Alert Contacts</Text>
            </TouchableOpacity>
          </View>

          {/* Journey tracker */}
          <View style={styles.journeyCard}>
            <Text style={styles.journeyTitle}>🧭 Journey Tracker</Text>
            <Text style={styles.journeyDesc}>
              Tell us your destination. Your contacts will be alerted if you stop unexpectedly or deviate from your route.
            </Text>

            {!journeyActive ? (
              <>
                <View style={styles.destRow}>
                  <Text style={styles.destLabel}>Going to:</Text>
                  <Text
                    style={styles.destInput}
                    onPress={() => Alert.prompt('Destination', 'Where are you going?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Set', onPress: (val) => setDestination(val || '') },
                    ])}
                  >
                    {destination || 'Tap to enter destination...'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.startJourneyBtn} onPress={startJourney}>
                  <Text style={styles.startJourneyText}>Start Journey Tracker</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.journeyActive}>
                <View style={styles.journeyActiveBadge}>
                  <Text style={styles.journeyActiveDot}>●</Text>
                  <Text style={styles.journeyActiveText}>JOURNEY ACTIVE — Tracking to {destination}</Text>
                </View>
                <TouchableOpacity style={styles.stopJourneyBtn} onPress={stopJourney}>
                  <Text style={styles.stopJourneyText}>✅ I Arrived Safely</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Safe zones info */}
          <View style={styles.safeZoneCard}>
            <Text style={styles.safeZoneTitle}>🏠 Safe Zones</Text>
            <Text style={styles.safeZoneDesc}>
              Mark your home, workplace, and frequent locations as safe zones. Contacts are notified when you leave or arrive.
            </Text>
            <TouchableOpacity style={styles.safeZoneBtn}>
              <Text style={styles.safeZoneBtnText}>+ Add Current Location as Safe Zone</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.police, padding: 20, paddingTop: 52 },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  content: { padding: 16, gap: 14 },
  mapWrap: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  map: { height: 220 },
  coordsBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8, alignItems: 'center',
  },
  coordsText: { fontSize: 11, color: COLORS.white, fontFamily: 'monospace' },
  shareRow: { flexDirection: 'row', gap: 10 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADIUS.md, padding: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  shareBtnAlt: { backgroundColor: COLORS.police, borderColor: COLORS.police },
  shareBtnIcon: { fontSize: 18 },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  journeyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10,
  },
  journeyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  journeyDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  destLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, width: 70 },
  destInput: {
    flex: 1, fontSize: 13, color: COLORS.primary,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, padding: 10, minHeight: 40,
  },
  startJourneyBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    padding: 12, alignItems: 'center',
  },
  startJourneyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  journeyActive: { gap: 10 },
  journeyActiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: 10,
  },
  journeyActiveDot: { fontSize: 10, color: COLORS.primary },
  journeyActiveText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: '700', flex: 1 },
  stopJourneyBtn: {
    backgroundColor: COLORS.success, borderRadius: RADIUS.md,
    padding: 12, alignItems: 'center',
  },
  stopJourneyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  safeZoneCard: {
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.lg,
    padding: 16, gap: 8, borderWidth: 1, borderColor: '#C0DD97',
  },
  safeZoneTitle: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  safeZoneDesc: { fontSize: 12, color: '#3B6D11', lineHeight: 18 },
  safeZoneBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    padding: 10, alignItems: 'center',
  },
  safeZoneBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
