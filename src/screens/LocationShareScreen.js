// src/screens/LocationShareScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Alert, ScrollView, StatusBar, ActivityIndicator, TextInput,
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
        `? My current location (Suraksha Safety App)\n\n` +
        `${url}\n\n` +
        `Accuracy: ±${accuracy}m | Time: ${time}\n\n` +
        `I am sharing this location for my safety.`,
      title: 'My Live Location ',
    });
  };

  const startJourney = () => {
    if (!destination.trim()) {
      Alert.alert('Destination Required', 'Please enter your destination');
      return;
    }

    Alert.alert(
      'Start Journey',
      `Share your live location while traveling to ${destination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            setJourneyActive(true);
          },
        },
      ]
    );
  };

  const stopJourney = () => {
    setJourneyActive(false);
    setDestination('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Location Sharing</Text>
        <Text style={styles.subtitle}>Share your location for safety</Text>
      </View>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="My Location"
            description={`Accuracy: ±${Math.round(location.coords.accuracy)}m`}
          />
          <Circle
            center={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            radius={location.coords.accuracy}
            strokeColor={COLORS.primary}
            fillColor="rgba(192, 21, 62, 0.1)"
          />
        </MapView>
      )}

      <ScrollView style={styles.controls}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Current Location</Text>
          <Text style={styles.locationCoords}>
            {location ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}` : 'Unknown'}
          </Text>
          <Text style={styles.locationAccuracy}>
            Accuracy: ±{location ? Math.round(location.coords.accuracy) : 0}m
          </Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={shareLocation}>
          <Text style={styles.shareBtnText}>? Share Location</Text>
        </TouchableOpacity>

        <View style={styles.journeySection}>
          <Text style={styles.journeyTitle}>Journey Tracker</Text>
          <Text style={styles.journeySubtitle}>
            Share live location while traveling
          </Text>

          {!journeyActive ? (
            <View style={styles.journeyForm}>
              <TextInput
                style={styles.destinationInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Enter destination"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity style={styles.startJourneyBtn} onPress={startJourney}>
                <Text style={styles.startJourneyBtnText}>Start Journey</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activeJourney}>
              <View style={styles.journeyStatus}>
                <Text style={styles.journeyStatusText}>Journey Active</Text>
                <Text style={styles.journeyDestination}>To: {destination}</Text>
              </View>
              <TouchableOpacity style={styles.stopJourneyBtn} onPress={stopJourney}>
                <Text style={styles.stopJourneyBtnText}>Stop Journey</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Privacy & Safety</Text>
          <Text style={styles.infoText}>
            Your location is only shared when you explicitly choose to share it.
          </Text>
          <Text style={styles.infoText}>
            Location sharing helps your trusted contacts know you're safe during emergencies.
          </Text>
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
  locationInfo: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: 24,
  },
  shareBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  journeySection: {
    marginBottom: 24,
  },
  journeyTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  journeySubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  journeyForm: {
    gap: 12,
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
  startJourneyBtn: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  startJourneyBtnText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  activeJourney: {
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  journeyStatus: {
    marginBottom: 12,
  },
  journeyStatusText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: 4,
  },
  journeyDestination: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  stopJourneyBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopJourneyBtnText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
});
