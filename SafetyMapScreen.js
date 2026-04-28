// src/screens/SafetyMapScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import { locationService } from '../services/locationService';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

// Indian emergency helplines and default police stations (fallback data)
const HELPLINES = [
  { name: 'Women Helpline', number: '1091', icon: '👩', type: 'helpline' },
  { name: 'Police', number: '100', icon: '🚔', type: 'police' },
  { name: 'National Emergency', number: '112', icon: '🆘', type: 'emergency' },
  { name: 'Ambulance', number: '108', icon: '🚑', type: 'medical' },
  { name: 'Child Helpline', number: '1098', icon: '🧒', type: 'helpline' },
  { name: 'Domestic Violence', number: '181', icon: '🏠', type: 'helpline' },
];

const DANGER_COLORS = {
  high: 'rgba(192,21,62,0.25)',
  medium: 'rgba(186,117,23,0.2)',
  low: 'rgba(59,109,17,0.15)',
};

export default function SafetyMapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dangerZones, setDangerZones] = useState([]);
  const [reportingMode, setReportingMode] = useState(false);
  const [selectedType, setSelectedType] = useState('unsafe_area');
  const [reports, setReports] = useState([]);

  const REPORT_TYPES = [
    { id: 'unsafe_area', label: 'Unsafe Area', icon: '⚠️', color: COLORS.warning },
    { id: 'harassment', label: 'Harassment', icon: '🚨', color: COLORS.primary },
    { id: 'poor_lighting', label: 'Poor Lighting', icon: '🔦', color: COLORS.textSecondary },
    { id: 'safe_spot', label: 'Safe Spot', icon: '✅', color: COLORS.accent },
  ];

  useEffect(() => {
    initMap();
  }, []);

  const initMap = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
      await loadCommunityReports(loc);
    } catch {
      Alert.alert('Location needed', 'Enable location to see the safety map.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityReports = async (loc) => {
    try {
      const snap = await getDocs(collection(db, 'safety_reports'));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(data);
    } catch { }
  };

  const submitReport = async () => {
    if (!location) return;
    const user = auth.currentUser;
    const { latitude, longitude } = location.coords;

    try {
      const report = {
        userId: user.uid,
        type: selectedType,
        latitude,
        longitude,
        timestamp: serverTimestamp(),
        verified: false,
      };
      await addDoc(collection(db, 'safety_reports'), report);
      setReports((prev) => [...prev, { ...report, id: Date.now().toString() }]);
      setReportingMode(false);
      Alert.alert('Report Submitted ✅', 'Thank you! Your report helps keep other women safe.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Check your connection.');
    }
  };

  const markerColor = (type) => {
    if (type === 'safe_spot') return COLORS.accent;
    if (type === 'harassment') return COLORS.primary;
    if (type === 'poor_lighting') return COLORS.textSecondary;
    return COLORS.warning;
  };

  const markerIcon = (type) => {
    const t = REPORT_TYPES.find((r) => r.id === type);
    return t?.icon || '⚠️';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C447C" />

      <View style={styles.header}>
        <Text style={styles.title}>Safety Map</Text>
        <Text style={styles.subtitle}>Community-reported danger zones & safe spots</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading safety map...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {location && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              {/* User location */}
              <Marker
                coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                title="You are here"
                pinColor={COLORS.police}
              />

              {/* Community reports */}
              {reports.map((r) => r.latitude && (
                <React.Fragment key={r.id}>
                  <Marker
                    coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                    pinColor={markerColor(r.type)}
                  >
                    <View style={styles.customMarker}>
                      <Text style={{ fontSize: 20 }}>{markerIcon(r.type)}</Text>
                    </View>
                    <Callout>
                      <View style={styles.calloutBox}>
                        <Text style={styles.calloutTitle}>{REPORT_TYPES.find((t) => t.id === r.type)?.label || r.type}</Text>
                        <Text style={styles.calloutSub}>Community report</Text>
                      </View>
                    </Callout>
                  </Marker>
                  <Circle
                    center={{ latitude: r.latitude, longitude: r.longitude }}
                    radius={120}
                    fillColor={r.type === 'safe_spot' ? 'rgba(59,109,17,0.15)' : 'rgba(192,21,62,0.1)'}
                    strokeColor={r.type === 'safe_spot' ? COLORS.accent : COLORS.primary}
                    strokeWidth={0.5}
                  />
                </React.Fragment>
              ))}
            </MapView>
          )}

          {/* Report controls */}
          {reportingMode && (
            <View style={styles.reportPanel}>
              <Text style={styles.reportPanelTitle}>Report at current location</Text>
              <View style={styles.reportTypeRow}>
                {REPORT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.reportTypeChip, selectedType === t.id && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setSelectedType(t.id)}
                  >
                    <Text style={styles.reportTypeIcon}>{t.icon}</Text>
                    <Text style={[styles.reportTypeLabel, selectedType === t.id && { color: COLORS.white }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.reportBtns}>
                <TouchableOpacity style={styles.cancelReportBtn} onPress={() => setReportingMode(false)}>
                  <Text style={styles.cancelReportText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitReportBtn} onPress={submitReport}>
                  <Text style={styles.submitReportText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* FAB Report button */}
          {!reportingMode && (
            <TouchableOpacity style={styles.fab} onPress={() => setReportingMode(true)}>
              <Text style={styles.fabText}>+ Report</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Helplines */}
      <View style={styles.helplineSection}>
        <Text style={styles.helplineTitle}>📞 Emergency Helplines</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.helplineRow}>
          {HELPLINES.map((h) => (
            <TouchableOpacity key={h.number} style={styles.helplineCard}>
              <Text style={styles.helplineIcon}>{h.icon}</Text>
              <Text style={styles.helplineNumber}>{h.number}</Text>
              <Text style={styles.helplineName}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {REPORT_TYPES.map((t) => (
          <View key={t.id} style={styles.legendItem}>
            <Text style={{ fontSize: 12 }}>{t.icon}</Text>
            <Text style={styles.legendLabel}>{t.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: '#0C447C', padding: 20, paddingTop: 52 },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  customMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
    elevation: 3,
  },
  calloutBox: { padding: 8, minWidth: 100 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  calloutSub: { fontSize: 11, color: COLORS.textSecondary },
  reportPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, elevation: 10, gap: 12,
  },
  reportPanelTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  reportTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  reportTypeIcon: { fontSize: 14 },
  reportTypeLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  reportBtns: { flexDirection: 'row', gap: 10 },
  cancelReportBtn: {
    flex: 1, padding: 12, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelReportText: { fontSize: 13, color: COLORS.textSecondary },
  submitReportBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 12, alignItems: 'center' },
  submitReportText: { fontSize: 13, color: COLORS.white, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 18, paddingVertical: 12, elevation: 5,
  },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  helplineSection: { backgroundColor: COLORS.white, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  helplineTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  helplineRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 12 },
  helplineCard: {
    alignItems: 'center', backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md, padding: 10, minWidth: 70, gap: 3,
  },
  helplineIcon: { fontSize: 18 },
  helplineNumber: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  helplineName: { fontSize: 9, color: COLORS.primaryDark, textAlign: 'center', fontWeight: '600' },
  legend: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 8, gap: 12, flexWrap: 'wrap', borderTopWidth: 0.5, borderTopColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLabel: { fontSize: 10, color: COLORS.textSecondary },
});
