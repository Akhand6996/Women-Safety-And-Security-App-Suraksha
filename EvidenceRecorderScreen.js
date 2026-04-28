// src/screens/EvidenceRecorderScreen.js

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { Camera, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function EvidenceRecorderScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState('audio'); // 'audio' | 'video'
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [cameraRef, setCameraRef] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const timerRef = useRef(null);

  // ── AUDIO RECORDING ─────────────────────────────────────────────
  const startAudioRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Microphone permission is required to record evidence.');
      return;
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(rec);
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopAudioRecording = async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);

    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await uploadEvidence(uri, 'audio', 'm4a');
    }
  };

  // ── EVIDENCE UPLOAD ─────────────────────────────────────────────
  const uploadEvidence = async (uri, type, ext) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const path = `evidence/${user.uid}/${type}_${timestamp}.${ext}`;
      const storageRef = ref(storage, path);

      const response = await fetch(uri);
      const blob = await response.blob();

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob);
        task.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          reject,
          resolve
        );
      });

      const downloadURL = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'evidence'), {
        userId: user.uid,
        type,
        url: downloadURL,
        path,
        duration: type === 'audio' ? duration : 0,
        timestamp: serverTimestamp(),
        sharedWithContacts: false,
      });

      const entry = {
        id: timestamp.toString(),
        type,
        url: downloadURL,
        duration,
        recordedAt: new Date().toLocaleTimeString(),
      };

      setRecordings((prev) => [entry, ...prev]);
      Alert.alert('Uploaded! ✅', 'Evidence saved securely to your vault.');
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not upload evidence. Check your connection.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.title}>Evidence Recorder</Text>
        <Text style={styles.subtitle}>All evidence is encrypted and stored securely</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {['audio', 'video', 'photo'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => !isRecording && setMode(m)}
            >
              <Text style={styles.modeIcon}>
                {m === 'audio' ? '🎙️' : m === 'video' ? '📹' : '📸'}
              </Text>
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recorder */}
        <View style={styles.recorderCard}>
          {mode === 'audio' && (
            <View style={styles.audioRecorder}>
              <View style={[styles.micCircle, isRecording && styles.micCircleActive]}>
                <Text style={styles.micIcon}>🎙️</Text>
              </View>

              {isRecording && (
                <>
                  <Text style={styles.recStatus}>● REC {formatDuration(duration)}</Text>
                  <View style={styles.waveformPlaceholder}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <View
                        key={i}
                        style={[styles.waveBar, { height: 10 + Math.random() * 30 }]}
                      />
                    ))}
                  </View>
                </>
              )}

              {!isRecording && (
                <Text style={styles.recHint}>Tap record to start capturing audio evidence</Text>
              )}

              <TouchableOpacity
                style={[styles.recBtn, isRecording && styles.recBtnStop]}
                onPress={isRecording ? stopAudioRecording : startAudioRecording}
                disabled={uploading}
              >
                <Text style={styles.recBtnIcon}>{isRecording ? '⏹️' : '🔴'}</Text>
                <Text style={styles.recBtnText}>{isRecording ? 'Stop & Upload' : 'Start Recording'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(mode === 'video' || mode === 'photo') && (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderIcon}>{mode === 'video' ? '📹' : '📸'}</Text>
              <Text style={styles.cameraPlaceholderText}>
                {mode === 'video' ? 'Video recording' : 'Photo capture'} opens your device camera.
              </Text>
              <TouchableOpacity style={styles.recBtn}>
                <Text style={styles.recBtnText}>
                  {mode === 'video' ? 'Open Camera & Record' : 'Open Camera & Capture'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Upload progress */}
          {uploading && (
            <View style={styles.uploadBar}>
              <Text style={styles.uploadText}>Uploading... {uploadProgress}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Stealth mode notice */}
        <View style={styles.stealthBanner}>
          <Text style={styles.stealthTitle}>🕵️ Stealth Mode</Text>
          <Text style={styles.stealthText}>
            During SOS, recording starts automatically and silently — no visible indicators. Evidence is streamed directly to your contacts and saved to the encrypted vault.
          </Text>
        </View>

        {/* Recent recordings */}
        {recordings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Evidence</Text>
            {recordings.map((r) => (
              <View key={r.id} style={styles.evidenceRow}>
                <View style={styles.evidenceIcon}>
                  <Text style={{ fontSize: 20 }}>{r.type === 'audio' ? '🎙️' : r.type === 'video' ? '📹' : '📸'}</Text>
                </View>
                <View style={styles.evidenceInfo}>
                  <Text style={styles.evidenceType}>{r.type.charAt(0).toUpperCase() + r.type.slice(1)} evidence</Text>
                  <Text style={styles.evidenceMeta}>
                    Recorded at {r.recordedAt} · {r.type === 'audio' ? formatDuration(r.duration) : 'Captured'}
                  </Text>
                </View>
                <View style={styles.evidenceUploaded}>
                  <Text style={styles.uploadedText}>✅ Saved</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 52 },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1, borderRadius: RADIUS.md, padding: 12,
    alignItems: 'center', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  modeBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  modeIcon: { fontSize: 22 },
  modeText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  modeTextActive: { color: COLORS.primary },
  recorderCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 20,
    marginBottom: 14,
  },
  audioRecorder: { alignItems: 'center', gap: 14 },
  micCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  micCircleActive: { backgroundColor: COLORS.primary },
  micIcon: { fontSize: 38 },
  recStatus: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  waveformPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 50 },
  waveBar: { width: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  recHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  recBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  recBtnStop: { backgroundColor: COLORS.primaryDark },
  recBtnIcon: { fontSize: 16 },
  recBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  cameraPlaceholder: { alignItems: 'center', gap: 12, padding: 20 },
  cameraPlaceholderIcon: { fontSize: 48 },
  cameraPlaceholderText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  uploadBar: { marginTop: 12, gap: 6 },
  uploadText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  stealthBanner: {
    backgroundColor: '#1A1A1A', borderRadius: RADIUS.md,
    padding: 14, marginBottom: 16,
  },
  stealthTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  stealthText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  evidenceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8, gap: 12,
  },
  evidenceIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  evidenceInfo: { flex: 1 },
  evidenceType: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  evidenceMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  evidenceUploaded: {
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  uploadedText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
});
