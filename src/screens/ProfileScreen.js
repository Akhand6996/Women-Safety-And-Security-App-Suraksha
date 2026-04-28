// src/screens/ProfileScreen.js

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [nightMode, setNightMode] = useState(false);
  const [sensorGuard, setSensorGuard] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
          },
        },
      ]
    );
  };

  const ProfileSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontFamily: FONT_FAMILY.bold }]}>{title}</Text>
      {children}
    </View>
  );

  const ProfileItem = ({ label, value, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Text style={[styles.profileItemLabel, { fontFamily: FONT_FAMILY.regular }]}>{label}</Text>
        {value && <Text style={[styles.profileItemValue, { fontFamily: FONT_FAMILY.regular }]}>{value}</Text>}
      </View>
      {rightComponent || <Text style={[styles.profileItemArrow, { fontFamily: FONT_FAMILY.regular }]}>&gt;</Text>}
    </TouchableOpacity>
  );

  const ToggleItem = ({ label, value, onToggle }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <Text style={[styles.profileItemLabel, { fontFamily: FONT_FAMILY.regular }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: FONT_FAMILY.bold }]}>Profile</Text>
        <Text style={[styles.subtitle, { fontFamily: FONT_FAMILY.regular }]}>Manage your account and settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <ProfileSection title="Account Information">
          <ProfileItem label="Name" value={profile?.name || user?.displayName || 'User'} />
          <ProfileItem label="Email" value={user?.email} />
          <ProfileItem label="Phone" value={profile?.phone || 'Not added'} />
          <ProfileItem label="Blood Group" value={profile?.bloodGroup || 'Not specified'} />
          <ProfileItem 
            label="Emergency Contacts" 
            value={`${profile?.emergencyContacts?.length || 0} contacts`}
            onPress={() => navigation.navigate('Contacts')}
          />
        </ProfileSection>

        {/* Emergency ID Card */}
        <ProfileSection title="Emergency ID Card">
          <View style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <Text style={[styles.idCardTitle, { fontFamily: FONT_FAMILY.bold }]}>Emergency ID</Text>
              <Text style={[styles.idCardSubtitle, { fontFamily: FONT_FAMILY.regular }]}>Suraksha Safety App</Text>
            </View>
            <View style={styles.idCardBody}>
              <Text style={[styles.idCardName, { fontFamily: FONT_FAMILY.regular }]}>{profile?.name || 'User'}</Text>
              <Text style={[styles.idCardInfo, { fontFamily: FONT_FAMILY.regular }]}>{user?.email}</Text>
              <Text style={[styles.idCardInfo, { fontFamily: FONT_FAMILY.regular }]}>{profile?.phone || 'Phone: Not specified'}</Text>
              <Text style={styles.idCardInfo}>Blood: {profile?.bloodGroup || 'Not specified'}</Text>
            </View>
            <View style={styles.idCardFooter}>
              <Text style={[styles.idCardNote, { fontFamily: FONT_FAMILY.regular }]}>Show this in emergencies</Text>
            </View>
          </View>
        </ProfileSection>

        {/* Settings */}
        <ProfileSection title="Settings">
          <ToggleItem 
            label="Night Mode" 
            value={nightMode} 
            onToggle={setNightMode} 
          />
          <ToggleItem 
            label="Sensor Guard (Fall Detection)" 
            value={sensorGuard} 
            onToggle={setSensorGuard} 
          />
          <ToggleItem 
            label="Check-in Reminders" 
            value={checkInReminders} 
            onToggle={setCheckInReminders} 
          />
        </ProfileSection>

        {/* App Info */}
        <ProfileSection title="About">
          <ProfileItem label="📱 App Version" value="1.0.0" />
          <ProfileItem label="🔒 Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Your data is encrypted and never shared.')} />
          <ProfileItem label="📋 Terms of Service" onPress={() => Alert.alert('Terms', 'Use this app responsibly for safety purposes.')} />
          <ProfileItem label="💬 Help & Support" onPress={() => Alert.alert('Support', 'Contact us at support@suraksha.app')} />
        </ProfileSection>

        {/* Actions */}
        <ProfileSection title="Actions">
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={[styles.logoutBtnText, { fontFamily: FONT_FAMILY.regular }]}>Logout</Text>
          </TouchableOpacity>
        </ProfileSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontFamily: FONT_FAMILY.regular }]}>Made with ❤️ for women's safety</Text>
          <Text style={[styles.footerSubtext, { fontFamily: FONT_FAMILY.regular }]}>Stay safe, stay connected</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  profileItemLeft: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: SIZES.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  profileItemArrow: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  idCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 8,
  },
  idCardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  idCardTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  idCardSubtitle: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  idCardBody: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  idCardName: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  idCardInfo: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  idCardFooter: {
    alignItems: 'center',
  },
  idCardNote: {
    fontSize: SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  logoutBtn: {
    backgroundColor: COLORS.danger + '15',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
});
