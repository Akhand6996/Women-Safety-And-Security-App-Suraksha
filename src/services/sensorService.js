// src/services/sensorService.js

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
    this.shakeThreshold = 2.5;
    this.fallThreshold = 4.0;
    this.shakeWindowMs = 2000;
    this.shakeTimestamp = 0;
  }

  startMonitoring(onDangerDetected) {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.onDangerDetected = onDangerDetected;

    Accelerometer.setUpdateInterval(200);
    this.accelSubscription = Accelerometer.addListener(this.handleAccelerometer.bind(this));

    Gyroscope.setUpdateInterval(200);
    this.gyroSubscription = Gyroscope.addListener(this.handleGyroscope.bind(this));
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.accelSubscription?.remove();
    this.gyroSubscription?.remove();
    this.accelSubscription = null;
    this.gyroSubscription = null;
  }

  handleAccelerometer({ x, y, z }) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

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

  handleGyroscope({ x, y, z }) {
    const rotationMag = Math.sqrt(x * x + y * y + z * z);
    if (rotationMag > 12) {
      this.onDangerDetected?.({
        type: 'VIOLENT_ROTATION',
        message: 'Abnormal device rotation detected.',
      });
    }
  }

  startInactivityCheck(expectedArrivalTime, onInactive) {
    const ms = expectedArrivalTime - Date.now();
    if (ms <= 0) return;
    return setTimeout(() => {
      onInactive?.();
    }, ms);
  }

  startVolumeButtonSOS(onTriggered) {
    return 'Volume SOS: Press Volume Up 3 times in 2 seconds';
  }
}

export const sensorService = new SensorService();
