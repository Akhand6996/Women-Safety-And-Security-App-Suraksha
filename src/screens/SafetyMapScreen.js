// src/screens/SafetyMapScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

export default function SafetyMapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [safeZones, setSafeZones] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);

  useEffect(() => {
    loadLocation();
    loadSafetyData();
  }, []);

  const loadLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch {
      Alert.alert('Location Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const loadSafetyData = () => {
    setSafeZones([
      { id: 1, name: 'Police Station', latitude: 28.6139, longitude: 77.2090, type: 'police' },
      { id: 2, name: 'Hospital', latitude: 28.6150, longitude: 77.2080, type: 'hospital' },
    ]);

    setDangerZones([
      { id: 1, name: 'Reported Area', latitude: 28.6120, longitude: 77.2100, type: 'danger' },
    ]);
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      resolve({
        coords: { latitude: 28.6139, longitude: 77.2090, accuracy: 10 }
      });
    });
  };

  const reportDanger = () => {
    Alert.alert(
      'Report Danger Zone',
      'Help keep our community safe by reporting dangerous areas',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => Alert.alert('Thank You', 'Your report helps keep others safe') }
      ]
    );
  };

  const findNearbyHelp = () => {
    Alert.alert(
      'Find Help',
      'Showing nearby police stations, hospitals, and safe places',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { fontFamily: FONT_FAMILY.regular }]}>Loading safety map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: FONT_FAMILY.bold }]}>Safety Map</Text>
        <Text style={[styles.subtitle, { fontFamily: FONT_FAMILY.regular }]}>Community safety information</Text>
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

          {safeZones.map((zone) => (
            <Marker
              key={zone.id}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
              pinColor={zone.type === 'police' ? COLORS.info : COLORS.success}
            />
          ))}

          {dangerZones.map((zone) => (
            <Marker
              key={zone.id}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
              pinColor={COLORS.danger}
            />
          ))}
        </MapView>
      )}

      <ScrollView style={styles.controls}>
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Map Legend</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
            <Text style={styles.legendText}>Police Station</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Hospital</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Danger Zone</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={findNearbyHelp}>
            <Text style={[styles.actionBtnIcon, { fontFamily: FONT_FAMILY.regular }]}>🏥</Text>
            <Text style={[styles.actionBtnText, { fontFamily: FONT_FAMILY.regular }]}>Find Nearby Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={reportDanger}>
            <Text style={[styles.actionBtnIcon, { fontFamily: FONT_FAMILY.regular }]}>⚠️</Text>
            <Text style={[styles.actionBtnText, { fontFamily: FONT_FAMILY.regular }]}>Report Danger Zone</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { fontFamily: FONT_FAMILY.regular }]}>Community Safety</Text>
          <Text style={[styles.infoText, { fontFamily: FONT_FAMILY.regular }]}>
            This map shows community-reported safety information to help you make informed decisions about your route.
          </Text>
          <Text style={styles.infoText}>
            Contribute by reporting safe zones and areas to avoid.
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
  legend: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dangerBtn: {
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger,
  },
  actionBtnIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionBtnText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoSection: {
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 20,
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
    marginBottom: 4,
  },
});
