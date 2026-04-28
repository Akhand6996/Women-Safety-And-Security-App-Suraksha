// src/services/sosService.js
// Core SOS engine 

import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from './firebase';

class SOSService {
  constructor() {
    this.isActive = false;
    this.recording = null;
    this.locationSubscription = null;
    this.currentLocation = null;
    this.evidenceUrls = [];
    this.sosStartTime = null;
  }

  async triggerSOS(emergencyContacts, onStatusUpdate) {
    if (this.isActive) return;
    this.isActive = true;
    this.sosStartTime = new Date();
    this.evidenceUrls = [];

    onStatusUpdate?.('Getting location...');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    try {
      const location = await this.getLocation();
      this.currentLocation = location;
      onStatusUpdate?.('Location acquired. Starting recording...');

      await this.startAudioRecording();
      onStatusUpdate?.('Recording started. Alerting contacts...');

      await this.sendSOSMessages(emergencyContacts, location);
      onStatusUpdate?.('Alerts sent! Evidence being uploaded...');

      this.startLiveTracking(emergencyContacts);

      await this.logSOSEvent(location);

      onStatusUpdate?.('SOS ACTIVE ');
      return { success: true, location };
    } catch (err) {
      this.isActive = false;
      throw err;
    }
  }

  async cancelSOS(onStatusUpdate) {
    onStatusUpdate?.('Stopping SOS...');
    this.isActive = false;

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        if (uri) {
          onStatusUpdate?.('Uploading audio evidence...');
          const url = await this.uploadEvidence(uri, 'audio', 'mp4');
          this.evidenceUrls.push(url);
        }
      } catch (e) {
        console.log('Recording stop error:', e);
      }
      this.recording = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    onStatusUpdate?.('SOS cancelled. Evidence saved.');
  }

  async getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    return loc;
  }

  startLiveTracking(contacts) {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 10 },
      (location) => {
        this.currentLocation = location;
      }
    ).then((sub) => {
      this.locationSubscription = sub;
    });
  }

  getLocationURL(location) {
    const { latitude, longitude } = location.coords;
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  async startAudioRecording() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  async uploadEvidence(uri, type, extension) {
    const user = auth.currentUser;
    if (!user) return null;

    const timestamp = Date.now();
    const path = `evidence/${user.uid}/${type}_${timestamp}.${extension}`;
    const storageRef = ref(storage, path);

    const response = await fetch(uri);
    const blob = await response.blob();

    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on('state_changed', null, reject, resolve);
    });

    return await getDownloadURL(storageRef);
  }

  async sendSOSMessages(emergencyContacts, location) {
    const locURL = this.getLocationURL(location);
    const time = new Date().toLocaleTimeString();
    const user = auth.currentUser;

    const message =
      `SOS ALERT from ${user?.displayName || 'User'} - SURAKSHA APP\n\n` +
      `I need IMMEDIATE help! This is an emergency.\n\n` +
      `My Location: ${locURL}\n` +
      `Time: ${time}\n\n` +
      `Please call me or contact authorities immediately.\n` +
      `- Sent via Suraksha Women Safety App`;

    const phones = emergencyContacts.map((c) => c.phone).filter(Boolean);

    const allNumbers = [...phones, '1091', '100', '112'];

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(allNumbers, message);
    }
  }

  async logSOSEvent(location) {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'sos_events'), {
      userId: user.uid,
      userName: user.displayName,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
      evidenceUrls: this.evidenceUrls,
      timestamp: serverTimestamp(),
      status: 'active',
    });
  }

  initiateFakeCall(callerName = 'Mom') {
    return { callerName, duration: Math.floor(Math.random() * 120) + 30 };
  }
}

export const sosService = new SOSService();
