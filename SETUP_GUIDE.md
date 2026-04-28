# SURAKSHA — Women Safety App
## Complete Setup & APK Build Guide

---

## WHAT YOU HAVE

```
suraksha-app/
├── App.js                          ← Root entry
├── app.json                        ← Expo config & permissions
├── babel.config.js
├── eas.json                        ← APK/AAB build config
├── package.json                    ← All dependencies
├── firestore.rules                 ← Firebase security rules
├── google-services.json            ← YOU ADD THIS (from Firebase)
└── src/
    ├── context/
    │   └── AuthContext.js          ← Login state globally
    ├── navigation/
    │   └── AppNavigator.js         ← All routes & tabs
    ├── screens/
    │   ├── WelcomeScreen.js        ← Splash / onboarding
    │   ├── LoginScreen.js          ← Email login
    │   ├── RegisterScreen.js       ← Sign up
    │   ├── HomeScreen.js           ← SOS button + dashboard
    │   ├── ContactsScreen.js       ← Emergency contacts
    │   ├── EvidenceRecorderScreen.js ← Audio/video/photo
    │   ├── LocationShareScreen.js  ← Live location + map
    │   ├── SafetyMapScreen.js      ← Community heatmap
    │   ├── JourneyTrackerScreen.js ← Journey monitor
    │   ├── FakeCallScreen.js       ← Fake incoming call
    │   └── ProfileScreen.js        ← Profile + QR ID card
    ├── services/
    │   ├── firebase.js             ← Firebase init (ADD YOUR CONFIG)
    │   ├── authService.js          ← Login/Register/Logout
    │   ├── sosService.js           ← Core SOS engine
    │   ├── locationService.js      ← GPS + journey tracking
    │   └── sensorService.js        ← Fall/shake detection
    └── utils/
        └── theme.js                ← Colors, fonts, sizes
```

---

## STEP 1 — FIREBASE SETUP (FREE)

1. Go to → https://console.firebase.google.com
2. Click "Create a project" → name it "Suraksha"
3. In the left menu:

   **Authentication:**
   → Authentication → Sign-in method → Enable "Email/Password"

   **Firestore Database:**
   → Firestore Database → Create database → Start in test mode → Choose region (asia-south1 for India)

   **Storage:**
   → Storage → Get started → Start in test mode

4. Add your Android app:
   → Project settings (gear icon) → "Add app" → Android icon
   → Package name: `com.suraksha.womensafety`
   → Download `google-services.json`
   → Copy it into the ROOT of this project (next to App.js)

5. Copy your Firebase config:
   → Project settings → Your apps → SDK setup and configuration → Config
   → Open `src/services/firebase.js`
   → Replace the placeholder values with your real values

---

## STEP 2 — INSTALL DEPENDENCIES

Make sure you have Node.js 18+ installed, then run:

```bash
# Install Node dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI (for building APK)
npm install -g eas-cli
```

---

## STEP 3 — TEST ON YOUR PHONE (Expo Go)

```bash
# Start the development server
npx expo start

# Scan the QR code with Expo Go app
# Download "Expo Go" from Play Store on your Android phone
```

> Note: Some features (background location, stealth recording) require a real build.
> Use Expo Go for UI testing, then build APK for full features.

---

## STEP 4 — BUILD THE APK (Free with EAS)

EAS Build gives you 30 free builds/month — enough for your app.

```bash
# Login to your Expo account (create free at expo.dev)
eas login

# Configure your project
eas build:configure

# Build the APK file (for sharing/installing directly)
eas build -p android --profile preview

# This will:
# 1. Upload your code to Expo's cloud builder
# 2. Compile into a .APK file
# 3. Give you a download link for the APK (ready to install)
```

Build takes about 10–15 minutes. You'll get a direct APK download link.

---

## STEP 5 — DISTRIBUTE YOUR APK (Free Platforms)

### Option A — Direct APK share (easiest)
- Download the APK from EAS
- Share via WhatsApp, Google Drive, or email
- Users enable "Install from unknown sources" → install

### Option B — GitHub Releases (free hosting)
1. Create GitHub repo
2. Go to Releases → Create new release
3. Upload the APK file
4. Share the GitHub link

### Option C — APKPure / APKMirror (free app stores)
- Submit your APK to https://apkpure.com
- Free listing, no review fee

### Option D — Google Play (recommended for wide distribution)
- One-time $25 registration fee
- Millions of users, auto-updates

### Option E — F-Droid (free, open-source app store)
- Completely free
- Good for privacy-focused users
- Requires open-source code

---

## STEP 6 — DEPLOY FIRESTORE RULES

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init (select Firestore)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## FEATURES IMPLEMENTED

| Feature | Status | How |
|---------|--------|-----|
| Login / Register | ✅ | Firebase Auth |
| SOS button (5-sec countdown) | ✅ | HomeScreen |
| Instant SOS (long press) | ✅ | HomeScreen |
| SMS to contacts + 1091/100/112 | ✅ | sosService |
| Audio recording (stealth) | ✅ | EvidenceRecorderScreen |
| Video / Photo capture | ✅ | EvidenceRecorderScreen |
| Cloud evidence upload | ✅ | Firebase Storage |
| Live GPS location | ✅ | locationService |
| Location share via SMS/WhatsApp | ✅ | LocationShareScreen |
| Journey tracker | ✅ | JourneyTrackerScreen |
| Safe zones | ✅ | LocationShareScreen |
| Fall detection (accelerometer) | ✅ | sensorService |
| Shake SOS trigger | ✅ | sensorService |
| Gyroscope danger detection | ✅ | sensorService |
| Fake incoming call | ✅ | FakeCallScreen |
| Emergency contacts (up to 10) | ✅ | ContactsScreen |
| Phone contacts import | ✅ | ContactsScreen |
| Community safety map | ✅ | SafetyMapScreen |
| Danger zone reporting | ✅ | SafetyMapScreen |
| Profile + Emergency ID card | ✅ | ProfileScreen |
| Blood group / Medical info | ✅ | ProfileScreen |
| Night mode toggle | ✅ | ProfileScreen |
| Sensor guard toggle | ✅ | ProfileScreen |
| Check-in reminders | ✅ | ProfileScreen |
| Encrypted evidence vault | ✅ | Firebase Storage |
| Firestore security rules | ✅ | firestore.rules |
| Background permissions | ✅ | app.json |

---

## ADDING YOUR OWN POLICE STATION DATABASE

For sending alerts to nearby police stations automatically:

1. Create a Firestore collection `police_stations` with documents:
   ```json
   {
     "name": "Dadri Police Station",
     "phone": "01203507600",
     "email": "dadri.police@up.gov.in",
     "latitude": 28.5570,
     "longitude": 77.5541,
     "district": "Gautam Buddh Nagar"
   }
   ```

2. In `sosService.js`, add a `getNearbyPoliceStations()` function that queries
   Firestore for stations within 10km of current location using geoqueries.

3. Add their phone numbers to the SMS list in `sendSOSMessages()`.

---

## FUTURE UPGRADES (Next Version)

- [ ] Voice keyword detection ("Help me", "Bachaao")
- [ ] Wearable (smartwatch) heart rate integration
- [ ] WhatsApp API for evidence sharing
- [ ] Multilingual support (Hindi, Bengali, Tamil...)
- [ ] Offline mode with local SMS fallback
- [ ] Admin dashboard for NGOs/police
- [ ] AI-based danger route prediction
- [ ] Community SOS response network

---

## SUPPORT

For help setting up Firebase or building the APK, refer to:
- Expo docs: https://docs.expo.dev
- Firebase docs: https://firebase.google.com/docs
- EAS Build: https://docs.expo.dev/build/introduction

**This app is built for the safety of women. Share it freely.**
