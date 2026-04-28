// src/screens/ProfileScreen.js

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, StatusBar, Switch,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function ProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sensorGuard, setSensorGuard] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [checkIn, setCheckIn] = useState(true);

  const [form, setForm] = useState({
    name: profile?.name || user?.displayName || '',
    phone: profile?.phone || '',
    bloodGroup: profile?.bloodGroup || '',
    allergies: profile?.allergies || '',
    medicalInfo: profile?.medicalInfo || '',
    address: profile?.address || '',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...form, isProfileComplete: true });
      await refreshProfile();
      setEditing(false);
      Alert.alert('Profile Updated', 'Your safety profile has been saved.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Suraksha?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => authService.logout() },
    ]);
  };

  const Row = ({ label, value, fieldKey, keyboard, multiline }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
          value={form[fieldKey]}
          onChangeText={(v) => update(fieldKey, v)}
          keyboardType={keyboard || 'default'}
          multiline={multiline}
          placeholderTextColor={COLORS.textMuted}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || '—'}</Text>
      )}
    </View>
  );

  const completion = [
    form.name, form.phone, form.bloodGroup,
    profile?.emergencyContacts?.length > 0 ? 'yes' : '',
  ].filter(Boolean).length;
  const completionPct = Math.round((completion / 4) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.displayName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Profile completion */}
        <View style={styles.completionWrap}>
          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: `${completionPct}%` }]} />
          </View>
          <Text style={styles.completionText}>{completionPct}% profile complete</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Emergency ID Card */}
        <View style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <Text style={styles.idCardTitle}>🪪 Emergency ID Card</Text>
            <Text style={styles.idCardSub}>Shown to first responders</Text>
          </View>
          <View style={styles.idCardBody}>
            <View style={styles.idRow}>
              <Text style={styles.idKey}>Name</Text>
              <Text style={styles.idVal}>{form.name || '—'}</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idKey}>Blood Group</Text>
              <Text style={[styles.idVal, styles.idValBlood]}>{form.bloodGroup || '—'}</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idKey}>Allergies</Text>
              <Text style={styles.idVal}>{form.allergies || 'None'}</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idKey}>Emergency Contact</Text>
              <Text style={styles.idVal}>
                {profile?.emergencyContacts?.[0]?.name || '—'}
                {profile?.emergencyContacts?.[0]?.phone ? ` · ${profile.emergencyContacts[0].phone}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.idCardQR}>
            <Text style={styles.idCardQRText}>📲 QR code generated from your profile info — scannable by police and medical staff</Text>
          </View>
        </View>

        {/* Profile form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveProfile} style={styles.saveBtn} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Row label="Full Name" value={form.name} fieldKey="name" />
          <Row label="Phone" value={form.phone} fieldKey="phone" keyboard="phone-pad" />
          <Row label="Address" value={form.address} fieldKey="address" multiline />
          <Row label="Medical Info" value={form.medicalInfo} fieldKey="medicalInfo" multiline />
          <Row label="Allergies" value={form.allergies} fieldKey="allergies" />

          {/* Blood group selector */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Blood Group</Text>
            {editing ? (
              <View style={styles.bloodRow}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, form.bloodGroup === bg && styles.bloodChipActive]}
                    onPress={() => update('bloodGroup', bg)}
                  >
                    <Text style={[styles.bloodChipText, form.bloodGroup === bg && styles.bloodChipTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.fieldValue, form.bloodGroup && styles.bloodBadge]}>
                {form.bloodGroup || '—'}
              </Text>
            )}
          </View>
        </View>

        {/* Safety settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Settings</Text>

          {[
            { label: 'Sensor Guard', sub: 'Auto-detect falls and shaking', value: sensorGuard, onChange: setSensorGuard, icon: '🤖' },
            { label: 'Night Safety Mode', sub: 'Heightened monitoring after 9 PM', value: nightMode, onChange: setNightMode, icon: '🌙' },
            { label: 'Check-in Reminders', sub: 'Ping contacts if no activity', value: checkIn, onChange: setCheckIn, icon: '✅' },
          ].map((s) => (
            <View key={s.label} style={styles.settingRow}>
              <Text style={styles.settingIcon}>{s.icon}</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={styles.settingSub}>{s.sub}</Text>
              </View>
              <Switch
                value={s.value}
                onValueChange={s.onChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Suraksha</Text>
          <View style={styles.aboutRows}>
            {[
              ['Version', '1.0.0'],
              ['Build', 'Free • Open Source'],
              ['Data Storage', 'Firebase (Encrypted)'],
              ['Privacy Policy', 'suraksha.app/privacy'],
            ].map(([k, v]) => (
              <View key={k} style={styles.aboutRow}>
                <Text style={styles.aboutKey}>{k}</Text>
                <Text style={styles.aboutVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    backgroundColor: COLORS.primaryDark, alignItems: 'center',
    paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  completionWrap: { width: '80%', marginTop: 14, gap: 6 },
  completionTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  completionFill: { height: 5, backgroundColor: COLORS.white, borderRadius: 3 },
  completionText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  content: { padding: 16, gap: 14 },

  idCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.primary, overflow: 'hidden',
  },
  idCardHeader: {
    backgroundColor: COLORS.primary, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  idCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  idCardSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  idCardBody: { padding: 14, gap: 8 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idKey: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', flex: 1 },
  idVal: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 2, textAlign: 'right' },
  idValBlood: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  idCardQR: { backgroundColor: COLORS.primaryLight, padding: 10 },
  idCardQRText: { fontSize: 11, color: COLORS.primaryDark, textAlign: 'center' },

  section: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  editBtn: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 5 },
  editBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: 12, color: COLORS.textSecondary },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 5 },
  saveBtnText: { fontSize: 12, color: COLORS.white, fontWeight: '700' },

  fieldRow: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight, paddingBottom: 10, gap: 4 },
  fieldLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  fieldInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: COLORS.text,
  },
  fieldInputMulti: { minHeight: 60, textAlignVertical: 'top' },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  bloodChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  bloodChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bloodChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  bloodChipTextActive: { color: COLORS.white },
  bloodBadge: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 20, width: 28 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  settingSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  aboutRows: { gap: 8 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  aboutKey: { fontSize: 13, color: COLORS.textSecondary },
  aboutVal: { fontSize: 13, color: COLORS.text, fontWeight: '500' },

  logoutBtn: {
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
