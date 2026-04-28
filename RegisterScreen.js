// src/screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { authService } from '../services/authService';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      Alert.alert(
        'Account Created! 🎉',
        'Welcome to Suraksha. Let\'s set up your emergency contacts next.',
        [{ text: 'Get Started', style: 'default' }]
      );
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      else if (err.code === 'auth/weak-password') msg = 'Please choose a stronger password.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, fieldKey, placeholder, keyboardType, secureEntry, extra }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          style={[styles.input, errors[fieldKey] && styles.inputError, extra?.inputStyle]}
          value={form[fieldKey]}
          onChangeText={(v) => update(fieldKey, v)}
          placeholder={placeholder}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureEntry && !showPass}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          placeholderTextColor={COLORS.textMuted}
        />
        {(fieldKey === 'password' || fieldKey === 'confirm') && (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
            <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors[fieldKey] && <Text style={styles.errorText}>{errors[fieldKey]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Suraksha — it's completely free</Text>
        </View>

        {/* Steps indicator */}
        <View style={styles.stepsRow}>
          {['Personal Info', 'Set Password', 'Emergency Setup'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepCircle, i === 0 && styles.stepActive]}>
                <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field label="Full Name" fieldKey="name" placeholder="Priya Sharma" />
          <Field label="Email Address" fieldKey="email" placeholder="priya@email.com" keyboardType="email-address" />
          <Field label="Mobile Number" fieldKey="phone" placeholder="9876543210" keyboardType="phone-pad" />
          <Field label="Password" fieldKey="password" placeholder="Min 8 characters" secureEntry />
          <Field label="Confirm Password" fieldKey="confirm" placeholder="Repeat password" secureEntry />

          {/* Privacy note */}
          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              🔒 Your data is stored securely with Firebase and end-to-end encrypted. We never sell your information.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.registerBtnText}>Create Free Account →</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 24 },
  backBtn: { position: 'absolute', left: 0, top: 60, padding: 4 },
  backArrow: { fontSize: 22, color: COLORS.text },
  logoWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoIcon: { fontSize: 28 },
  title: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  stepsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 28, paddingHorizontal: 4,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  stepNumActive: { color: COLORS.white },
  stepLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  form: { gap: 14 },
  field: { gap: 5 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  input: {
    height: 52, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 16,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.primary },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  eyeText: { fontSize: 18 },
  errorText: { fontSize: 11, color: COLORS.primary },
  privacyBox: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  privacyText: { fontSize: 12, color: COLORS.info, lineHeight: 18 },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});
