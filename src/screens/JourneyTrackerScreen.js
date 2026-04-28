// src/screens/JourneyTrackerScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar, TextInput,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { locationService } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

export default function JourneyTrackerScreen() {
  const { profile } = useAuth();
  const [journeyActive, setJourneyActive] = useState(false);
  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [journeyId, setJourneyId] = useState(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
    } catch {
      Alert.alert('Location Error', 'Could not get your location');
    }
  };

  const startJourney = async () => {
    if (!destination.trim()) {
      Alert.alert('Destination Required', 'Please enter your destination');
      return;
    }

    if (!profile?.emergencyContacts?.length) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add emergency contacts before starting a journey',
        [{ text: 'Add Contacts', onPress: () => {} }]
      );
      return;
    }

    setLoading(true);
    try {
      const id = await locationService.startJourney(
        destination,
        profile.emergencyContacts,
        (location) => {
          setWaypoints(prev => [...prev, location]);
        }
      );
      
      setJourneyId(id);
      setJourneyActive(true);
      setWaypoints([]);
      Alert.alert('Journey Started', `Your location will be shared while traveling to ${destination}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start journey');
    } finally {
      setLoading(false);
    }
  };

  const stopJourney = async () => {
    try {
      await locationService.stopJourney();
      setJourneyActive(false);
      setJourneyId(null);
      setDestination('');
      Alert.alert('Journey Ended', 'Your location sharing has been stopped');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop journey');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Starting journey...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Journey Tracker</Text>
        <Text style={styles.subtitle}>Share your location while traveling</Text>
      </View>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            pinColor={COLORS.primary}
          />
          
          {waypoints.length > 1 && (
            <Polyline
              coordinates={waypoints.map(wp => ({
                latitude: wp.latitude,
                longitude: wp.longitude,
              }))}
              strokeColor={COLORS.primary}
              strokeWidth={3}
            />
          )}
        </MapView>
      )}

      <ScrollView style={styles.controls}>
        {!journeyActive ? (
          <View style={styles.startSection}>
            <Text style={styles.sectionTitle}>Start Your Journey</Text>
            <Text style={styles.sectionSubtitle}>
              Your location will be shared with emergency contacts
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Destination</Text>
              <TextInput
                style={styles.destinationInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Where are you going?"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startJourney}>
              <Text style={styles.startBtnText}>🚀 Start Journey</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeSection}>
            <View style={styles.journeyStatus}>
              <Text style={styles.statusTitle}>Journey Active</Text>
              <Text style={styles.destination}>To: {destination}</Text>
              <Text style={styles.waypointCount}>
                Waypoints: {waypoints.length}
              </Text>
            </View>

            <TouchableOpacity style={styles.stopBtn} onPress={stopJourney}>
              <Text style={styles.stopBtnText}>⏹️ End Journey</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              📍 Your location is shared with emergency contacts every 30 seconds
            </Text>
          <Text style={styles.infoText}>
            👥 Contacts can track your journey in real-time
          </Text>
          <Text style={styles.infoText}>
              🛑 Location stops automatically when you end the journey
            </Text>
        </View>

        <View style={styles.safetyTips}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <Text style={styles.tipItem}>📍 Share your ETA with someone you trust</Text>
          <Text style={styles.tipItem}>🔋 Keep your phone charged during journey</Text>
          <Text style={styles.tipItem}>💡 Use well-lit, populated routes</Text>
          <Text style={styles.tipItem}>👥 Have emergency contacts ready</Text>
        </View>

        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>Emergency Options</Text>
          <TouchableOpacity style={styles.emergencyBtn}>
            <Text style={styles.emergencyBtnText}>🆘 Trigger SOS</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  map: {
    height: 300,
    marginHorizontal: 24,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
  },
  controls: {
    flex: 1,
    paddingHorizontal: 24,
  },
  startSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  sectionSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  destinationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  startBtn: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  startBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  activeSection: {
    marginBottom: 24,
  },
  journeyStatus: {
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.info,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  destination: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  waypointCount: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  stopBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  infoText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  safetyTips: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  tipItem: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  emergencySection: {
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  emergencyBtn: {
    backgroundColor: COLORS.danger + '15',
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  emergencyBtnText: {
    color: COLORS.danger,
    fontSize: SIZES.md,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});
