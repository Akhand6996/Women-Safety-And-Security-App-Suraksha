// src/services/locationService.js

import * as Location from 'expo-location';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

class LocationService {
  constructor() {
    this.watchSub = null;
    this.journeyInterval = null;
    this.journeyId = null;
  }

  async requestPermissions() {
    const fg = await Location.requestForegroundPermissionsAsync();
    const bg = await Location.requestBackgroundPermissionsAsync();
    return fg.status === 'granted' && bg.status === 'granted';
  }

  async getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
  }

  getMapsURL(lat, lng) {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  getShareableLink(lat, lng, name) {
    return `https://maps.google.com/?q=${lat},${lng}&label=${encodeURIComponent(name + ' (Suraksha)')}&z=17`;
  }

  async startJourney(destination, contacts, onUpdate) {
    const user = auth.currentUser;
    if (!user) return;

    const journeyRef = await addDoc(collection(db, 'journeys'), {
      userId: user.uid,
      userName: user.displayName,
      destination,
      startTime: serverTimestamp(),
      status: 'active',
      waypoints: [],
    });

    this.journeyId = journeyRef.id;

    this.watchSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 30000, distanceInterval: 50 },
      async (location) => {
        const { latitude, longitude } = location.coords;
        onUpdate?.({ latitude, longitude });

        await updateDoc(journeyRef, {
          [`waypoints.${Date.now()}`]: { lat: latitude, lng: longitude },
          lastSeen: serverTimestamp(),
        });
      }
    );

    return journeyRef.id;
  }

  async stopJourney() {
    this.watchSub?.remove();
    this.watchSub = null;

    if (this.journeyId) {
      await updateDoc(doc(db, 'journeys', this.journeyId), {
        status: 'completed',
        endTime: serverTimestamp(),
      });
      this.journeyId = null;
    }
  }

  async addSafeZone(userId, { name, latitude, longitude, radius = 200 }) {
    const userRef = doc(db, 'users', userId);
    const { arrayUnion } = await import('firebase/firestore');
    await updateDoc(userRef, {
      safeZones: arrayUnion({ name, latitude, longitude, radius }),
    });
  }

  isInsideSafeZone(location, safeZones) {
    const { latitude, longitude } = location.coords;
    return safeZones.some((zone) => {
      const dist = this.haversineDistance(latitude, longitude, zone.latitude, zone.longitude);
      return dist <= zone.radius;
    });
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export const locationService = new LocationService();
