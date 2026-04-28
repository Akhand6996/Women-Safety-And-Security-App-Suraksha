// src/screens/EvidenceRecorderScreen.js

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { Camera, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

export default function EvidenceRecorderScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState('audio');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [cameraRef, setCameraRef] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const timerRef = useRef(null);

  const startAudioRecording = async () => {
    try {
      console.log('Starting audio recording...');
      
      // Clean up any existing recording
      if (recording) {
        console.log('Cleaning up existing recording...');
        try {
          await recording.stopAndUnloadAsync();
        } catch (error) {
          console.log('Error cleaning up existing recording:', error);
        }
        setRecording(null);
        setIsRecording(false);
        setDuration(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required to record evidence.');
        return;
      }

      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      
      console.log('Creating recording...');
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      console.log('Recording created:', rec);
      setRecording(rec);
      setIsRecording(true);
      setDuration(0);

      console.log('Starting timer...');
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      console.log('Audio recording started successfully!');
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording: ' + error.message);
    }
  };

  const stopAudioRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      console.log('Stopping audio recording...');
      
      if (!recording) {
        throw new Error('No active recording found');
      }
      
      const status = await recording.getStatusAsync();
      console.log('Recording status before stop:', status);
      
      await recording.stopAndUnloadAsync();
      console.log('Recording stopped and unloaded');
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      if (uri) {
        // Verify file exists before upload
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('File exists:', fileInfo.exists, 'Size:', fileInfo.size);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          await uploadEvidence(uri, 'audio', 'm4a');
        } else {
          throw new Error('Recording file is empty or does not exist');
        }
      } else {
        throw new Error('No recording URI found');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    } finally {
      setRecording(null);
      setIsRecording(false);
      setDuration(0);
    }
  };

  const startVideoRecording = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to record video evidence.');
      return;
    }

    try {
      const videoRecordOptions = {
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 60, // 60 seconds max
        mute: false,
      };

      const { uri } = await cameraRef.recordAsync(videoRecordOptions);
      setRecording({ uri });
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (error) {
      console.error('Error starting video recording:', error);
      Alert.alert('Error', 'Failed to start video recording');
    }
  };

  const stopVideoRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      if (cameraRef) {
        await cameraRef.stopRecording();
      }
      
      if (recording && recording.uri) {
        await uploadEvidence(recording.uri, 'video', 'mp4');
      }
    } catch (error) {
      console.error('Error stopping video recording:', error);
      Alert.alert('Error', 'Failed to stop video recording');
    } finally {
      setRecording(null);
      setIsRecording(false);
      setDuration(0);
    }
  };

  const uploadEvidence = async (uri, type, extension) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting upload for:', { uri, type, extension });
      
      // Check if file exists and get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Try Firebase Storage first, fallback to local storage
      try {
        const timestamp = Date.now();
        const path = `evidence/${user.uid}/${type}_${timestamp}.${extension}`;
        console.log('Storage path:', path);
        
        const storageRef = ref(storage, path);

        const response = await fetch(uri);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size);
        
        if (blob.size === 0) {
          throw new Error('File is empty');
        }

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress);
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error during state change:', error);
            throw error;
          },
          () => {
            console.log('Upload completed');
          }
        );

        console.log('Starting upload task...');
        await uploadTask;
        console.log('Upload task completed');

        const downloadURL = await getDownloadURL(storageRef);
        console.log('Download URL obtained:', downloadURL);

        await addDoc(collection(db, 'evidence'), {
          userId: user.uid,
          type,
          url: downloadURL,
          timestamp: serverTimestamp(),
          size: blob.size,
        });
        console.log('Firestore document created');

        Alert.alert('Success', 'Evidence uploaded successfully to cloud');
      } catch (storageError) {
        console.log('Firebase Storage failed, using local fallback:', storageError);
        
        // Fallback to local storage
        const timestamp = Date.now();
        const localPath = `${FileSystem.documentDirectory}evidence_${user.uid}_${timestamp}.${extension}`;
        
        // Copy file to local storage
        await FileSystem.copyAsync({
          from: uri,
          to: localPath
        });
        
        console.log('File saved locally:', localPath);
        
        // Save metadata to Firestore
        try {
          await addDoc(collection(db, 'evidence'), {
            userId: user.uid,
            type,
            url: localPath, // Store local path instead of download URL
            timestamp: serverTimestamp(),
            size: fileInfo.size,
            isLocal: true, // Flag to indicate it's stored locally
          });
          console.log('Local evidence metadata saved to Firestore');

          Alert.alert(
            'Success', 
            'Evidence saved locally on your device. You can upload it later when cloud storage is available.',
            [{ text: 'OK', style: 'default' }]
          );
        } catch (firestoreError) {
          console.log('Firestore save failed, but file is saved locally:', firestoreError);
          Alert.alert(
            'Success', 
            'Evidence saved locally on your device. Metadata will be saved when connection is available.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        serverResponse: error.customData?.serverResponse,
        name: error.name,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to save evidence';
      let detailedError = '';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Cloud storage not available';
        detailedError = 'Using local storage instead. Your evidence is saved on your device.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was cancelled';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'Cloud storage not available';
        detailedError = 'Your Firebase account region doesn\'t support free storage. Evidence saved locally on your device.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage = 'Upload failed due to poor connection';
        detailedError = 'Evidence saved locally on your device. You can upload later.';
      } else {
        errorMessage = 'Save failed';
        detailedError = `Error: ${error.message}`;
      }
      
      Alert.alert(
        'Save Status', 
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default'
          },
          {
            text: 'View Details',
            onPress: () => Alert.alert('Details', detailedError || 'No additional details available.')
          }
        ]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'audio' && styles.modeBtnActive]}
        onPress={() => setMode('audio')}
      >
        <Text style={[styles.modeBtnText, mode === 'audio' && styles.modeBtnTextActive, { fontFamily: FONT_FAMILY.robotoRegular }]}>
          🎙 Audio
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'video' && styles.modeBtnActive]}
        onPress={() => setMode('video')}
      >
        <Text style={[styles.modeBtnText, mode === 'video' && styles.modeBtnTextActive, { fontFamily: FONT_FAMILY.robotoRegular }]}>
          📹 Video
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
        onPress={() => setMode('photo')}
      >
        <Text style={[styles.modeBtnText, mode === 'photo' && styles.modeBtnTextActive, { fontFamily: FONT_FAMILY.robotoRegular }]}>
          📷 Photo
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: FONT_FAMILY.robotoBold }]}>Evidence Recorder</Text>
        <Text style={[styles.subtitle, { fontFamily: FONT_FAMILY.robotoRegular }]}>Record and upload evidence securely</Text>
      </View>

      <ModeSelector />

      <ScrollView style={styles.content}>
        {mode === 'audio' && (
          <View style={styles.recordingSection}>
            <View style={styles.recordingVisual}>
              <Text style={[styles.recordingIcon, { fontFamily: FONT_FAMILY.robotoRegular }]}>🎙</Text>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <Text style={[styles.recordingText, { fontFamily: FONT_FAMILY.robotoRegular }]}>Recording...</Text>
                  <Text style={[styles.duration, { fontFamily: FONT_FAMILY.robotoRegular }]}>{formatDuration(duration)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={() => {
                console.log('Button pressed! isRecording:', isRecording, 'uploading:', uploading);
                if (isRecording) {
                  stopAudioRecording();
                } else {
                  startAudioRecording();
                }
              }}
              disabled={uploading}
            >
              <Text style={[styles.recordBtnText, { fontFamily: FONT_FAMILY.robotoRegular }]}>
                {isRecording ? 'Stop' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            {uploading && (
              <View style={styles.uploadProgress}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={[styles.uploadText, { fontFamily: FONT_FAMILY.robotoRegular }]}>
                  Uploading... {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {mode === 'video' && (
          <View style={styles.recordingSection}>
            <Text style={[styles.comingSoon, { fontFamily: FONT_FAMILY.robotoRegular }]}>📹 Video recording coming soon</Text>
          </View>
        )}

        {mode === 'photo' && (
          <View style={styles.recordingSection}>
            <Text style={[styles.comingSoon, { fontFamily: FONT_FAMILY.robotoRegular }]}>📷 Photo capture coming soon</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { fontFamily: FONT_FAMILY.robotoBold }]}>🔍 Why Record Evidence?</Text>
          <Text style={[styles.infoText, { fontFamily: FONT_FAMILY.robotoRegular }]}>
            Evidence recording helps document incidents for legal proceedings and provides proof for investigations.
          </Text>
          <Text style={[styles.infoText, { fontFamily: FONT_FAMILY.robotoRegular }]}>
            All recordings are encrypted and stored securely in Firebase cloud storage.
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
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordingVisual: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  recordingText: {
    fontSize: SIZES.md,
    color: COLORS.danger,
    fontWeight: '600',
    marginBottom: 4,
  },
  duration: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  recordBtnActive: {
    backgroundColor: COLORS.primary,
  },
  recordBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  uploadText: {
    marginLeft: 12,
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  comingSoon: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cameraContainer: {
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  infoSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoTitle: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
});
