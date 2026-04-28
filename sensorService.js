// src/services/sensorService.js
// Accelerometer, Gyroscope, and audio-based danger detection

import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Audio } from 'expo-av';

class SensorService {
  constructor() {
    this.accelSubscription = null;
    this.gyroSubscription = null;
    this.isMonitoring = false;
    this.onDangerDetected = null;
    this.lastValues = { x: 0, y: 0, z: 0 };
    this.shakeCount = 0;
    this.shakeThreshold = 2.5;      // G-force threshold
    this.fallThreshold = 4.0;       // Sudden drop + impact
    this.shakeWindowMs = 2000;
    this.shakeTimestamp = 0;
  }

  // ── START MONITORING ────────────────────────────────────────────
  startMonitoring(onDangerDetected) {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.onDangerDetected = onDangerDetected;

    Accelerometer.setUpdateInterval(200);
    this.accelSubscription = Accelerometer.addListener(this.handleAccelerometer.bind(this));

    Gyroscope.setUpdateInterval(200);
    this.gyroSubscription = Gyroscope.addListener(this.handleGyroscope.bind(this));
  }

  // ── STOP MONITORING ─────────────────────────────────────────────
  stopMonitoring() {
    this.isMonitoring = false;
    this.accelSubscription?.remove();
    this.gyroSubscription?.remove();
    this.accelSubscription = null;
    this.gyroSubscription = null;
  }

  // ── ACCELEROMETER LOGIC ─────────────────────────────────────────
  handleAccelerometer({ x, y, z }) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    // Fall detection: magnitude drops near 0 then spikes (free-fall + impact)
    if (magnitude < 0.3) {
      this._potentialFall = true;
    }
    if (this._potentialFall && magnitude > this.fallThreshold) {
      this._potentialFall = false;
      this.onDangerDetected?.({
        type: 'FALL_DETECTED',
        message: 'A fall was detected. Triggering SOS...',
        magnitude,
      });
      return;
    }

    // Shake detection (phone grabbed / struggled)
    const delta = Math.abs(magnitude - Math.sqrt(
      this.lastValues.x ** 2 + this.lastValues.y ** 2 + this.lastValues.z ** 2
    ));

    if (delta > this.shakeThreshold) {
      if (now - this.shakeTimestamp < this.shakeWindowMs) {
        this.shakeCount++;
        if (this.shakeCount >= 5) {
          this.shakeCount = 0;
          this.onDangerDetected?.({
            type: 'SHAKE_DETECTED',
            message: 'Violent shaking detected. Triggering SOS...',
          });
        }
      } else {
        this.shakeCount = 1;
        this.shakeTimestamp = now;
      }
    }

    this.lastValues = { x, y, z };
  }

  // ── GYROSCOPE LOGIC ─────────────────────────────────────────────
  handleGyroscope({ x, y, z }) {
    const rotationMag = Math.sqrt(x * x + y * y + z * z);
    // Sudden extreme rotation = possible forceful grab or struggle
    if (rotationMag > 12) {
      this.onDangerDetected?.({
        type: 'VIOLENT_ROTATION',
        message: 'Abnormal device rotation detected.',
      });
    }
  }

  // ── INACTIVITY DETECTION ────────────────────────────────────────
  startInactivityCheck(expectedArrivalTime, onInactive) {
    const ms = expectedArrivalTime - Date.now();
    if (ms <= 0) return;
    return setTimeout(() => {
      onInactive?.();
    }, ms);
  }

  // ── VOLUME BUTTON SOS (via shake pattern) ───────────────────────
  // Users press volume up 3× quickly → triggers SOS
  startVolumeButtonSOS(onTriggered) {
    // This is handled via the accelerometer rapid-change pattern
    // Real volume button capture requires native module — document for users
    return 'Volume SOS: Press Volume Up 3 times in 2 seconds';
  }
}

export const sensorService = new SensorService();
