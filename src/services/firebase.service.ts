/**
 * Firebase Integration Service
 * Firestore for real-time data, Firebase Auth, Cloud Functions triggers
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  Auth,
  User,
  UserCredential,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface PredictionData {
  eventId: string;
  timestamp: Timestamp;
  predictions: any[];
  hotspots: any[];
  risks: any[];
  alerts: any[];
  metrics: any;
}

interface IncidentData {
  id: string;
  type: string;
  severity: string;
  location: { lat: number; lon: number };
  timestamp: Timestamp;
  status: 'active' | 'responding' | 'resolved';
  assignedResponders: string[];
  description: string;
}

interface ResponderData {
  id: string;
  name: string;
  type: string;
  location: { lat: number; lon: number };
  status: string;
  lastUpdate: Timestamp;
}

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private storage: FirebaseStorage | null = null;
  private initialized: boolean = false;

  /**
   * Initialize Firebase
   */
  initialize(config?: FirebaseConfig): void {
    if (this.initialized) {
      console.log('[Firebase] Already initialized');
      return;
    }

    const firebaseConfig: FirebaseConfig = config || {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

    try {
      // Check if app already exists
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);

      this.initialized = true;
      console.log('[Firebase] Initialized successfully');
    } catch (error) {
      console.error('[Firebase] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store prediction data in Firestore
   */
  async storePrediction(data: Omit<PredictionData, 'timestamp'>): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const predictionRef = doc(
        collection(this.db, 'predictions'),
        `${data.eventId}_${Date.now()}`
      );

      await setDoc(predictionRef, {
        ...data,
        timestamp: Timestamp.now(),
      });

      console.log('[Firebase] Prediction stored successfully');
    } catch (error) {
      console.error('[Firebase] Failed to store prediction:', error);
      throw error;
    }
  }

  /**
   * Store incident data in Firestore
   */
  async storeIncident(data: Omit<IncidentData, 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const incidentRef = doc(collection(this.db, 'incidents'));

      await setDoc(incidentRef, {
        ...data,
        timestamp: Timestamp.now(),
      });

      console.log('[Firebase] Incident stored:', incidentRef.id);
      return incidentRef.id;
    } catch (error) {
      console.error('[Firebase] Failed to store incident:', error);
      throw error;
    }
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: IncidentData['status']
  ): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const incidentRef = doc(this.db, 'incidents', incidentId);
      await setDoc(
        incidentRef,
        {
          status,
          lastUpdate: Timestamp.now(),
        },
        { merge: true }
      );

      console.log('[Firebase] Incident status updated:', incidentId, status);
    } catch (error) {
      console.error('[Firebase] Failed to update incident status:', error);
      throw error;
    }
  }

  /**
   * Store responder location update
   */
  async updateResponderLocation(data: ResponderData): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const responderRef = doc(this.db, 'responders', data.id);

      await setDoc(
        responderRef,
        {
          ...data,
          lastUpdate: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[Firebase] Failed to update responder location:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time predictions
   */
  subscribeToPredictions(
    eventId: string,
    callback: (predictions: PredictionData[]) => void
  ): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    const q = query(
      collection(this.db, 'predictions'),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const predictions: PredictionData[] = snapshot.docs.map(
        (doc) => doc.data() as PredictionData
      );
      callback(predictions);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to real-time incidents
   */
  subscribeToIncidents(
    callback: (incidents: IncidentData[]) => void
  ): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    const q = query(
      collection(this.db, 'incidents'),
      where('status', 'in', ['active', 'responding']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidents: IncidentData[] = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as IncidentData)
      );
      callback(incidents);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to responder locations
   */
  subscribeToResponders(
    callback: (responders: ResponderData[]) => void
  ): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    const respondersRef = collection(this.db, 'responders');

    const unsubscribe = onSnapshot(respondersRef, (snapshot) => {
      const responders: ResponderData[] = snapshot.docs.map(
        (doc) => doc.data() as ResponderData
      );
      callback(responders);
    });

    return unsubscribe;
  }

  /**
   * Get historical incidents
   */
  async getHistoricalIncidents(
    eventId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncidentData[]> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'incidents'),
        where('eventId', '==', eventId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as IncidentData)
      );
    } catch (error) {
      console.error('[Firebase] Failed to get historical incidents:', error);
      throw error;
    }
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    path: string,
    file: Blob | Uint8Array,
    metadata?: any
  ): Promise<string> {
    if (!this.storage) throw new Error('Firebase not initialized');

    try {
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('[Firebase] File uploaded:', path);
      return downloadURL;
    } catch (error) {
      console.error('[Firebase] File upload failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async signIn(email: string, password: string): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('[Firebase] User signed in:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('[Firebase] Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async signUp(email: string, password: string): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('[Firebase] User created:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('[Firebase] Sign up failed:', error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      await signOut(this.auth);
      console.log('[Firebase] User signed out');
    } catch (error) {
      console.error('[Firebase] Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(useRedirect: boolean = false): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        // Result will be handled in handleRedirectResult
        return null as any; // Redirect doesn't return immediately
      } else {
        const result = await signInWithPopup(this.auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        console.log('[Firebase] Google Sign-In successful:', result.user.uid);
        console.log('[Firebase] Access token:', credential?.accessToken);
        return result.user;
      }
    } catch (error: any) {
      console.error('[Firebase] Google Sign-In failed:', error);

      // Handle specific errors
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in is in progress.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email address.');
      }

      throw error;
    }
  }

  /**
   * Sign in with Facebook OAuth
   */
  async signInWithFacebook(useRedirect: boolean = false): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    const provider = new FacebookAuthProvider();
    provider.addScope('public_profile');
    provider.addScope('email');

    try {
      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        return null as any;
      } else {
        const result = await signInWithPopup(this.auth, provider);
        console.log('[Firebase] Facebook Sign-In successful:', result.user.uid);
        return result.user;
      }
    } catch (error: any) {
      console.error('[Firebase] Facebook Sign-In failed:', error);
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Sign in with GitHub OAuth
   */
  async signInWithGithub(useRedirect: boolean = false): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    const provider = new GithubAuthProvider();
    provider.addScope('user:email');

    try {
      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        return null as any;
      } else {
        const result = await signInWithPopup(this.auth, provider);
        console.log('[Firebase] GitHub Sign-In successful:', result.user.uid);
        return result.user;
      }
    } catch (error: any) {
      console.error('[Firebase] GitHub Sign-In failed:', error);
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Handle redirect result after OAuth redirect
   */
  async handleRedirectResult(): Promise<UserCredential | null> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        console.log('[Firebase] Redirect Sign-In successful:', result.user.uid);
      }
      return result;
    } catch (error: any) {
      console.error('[Firebase] Redirect result error:', error);
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Handle OAuth errors with user-friendly messages
   */
  private handleOAuthError(error: any): Error {
    const errorMessages: Record<string, string> = {
      'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
      'auth/popup-closed-by-user': 'Sign-in cancelled.',
      'auth/cancelled-popup-request': 'Another sign-in is in progress.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email address.',
      'auth/credential-already-in-use': 'This credential is already in use.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    const message = errorMessages[error.code] || error.message || 'Authentication failed';
    return new Error(message);
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!this.auth) throw new Error('Firebase not initialized');

    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    if (!this.auth) throw new Error('Firebase not initialized');
    return this.auth.currentUser;
  }

  /**
   * Store analytics event
   */
  async storeAnalyticsEvent(event: {
    eventId: string;
    type: string;
    data: any;
  }): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const analyticsRef = doc(collection(this.db, 'analytics'));

      await setDoc(analyticsRef, {
        ...event,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('[Firebase] Failed to store analytics event:', error);
    }
  }

  /**
   * Batch write for performance
   */
  async batchWritePredictions(predictions: any[]): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const batch = predictions.map((pred) =>
        setDoc(
          doc(collection(this.db!, 'predictions'), `${pred.eventId}_${Date.now()}_${Math.random()}`),
          {
            ...pred,
            timestamp: Timestamp.now(),
          }
        )
      );

      await Promise.all(batch);
      console.log('[Firebase] Batch write completed:', predictions.length);
    } catch (error) {
      console.error('[Firebase] Batch write failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to video frames updates
   */
  subscribeToVideoFrames(callback: (frames: any[]) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'videoFrames'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const frames = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(frames);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to video frames:', error);
      throw error;
    }
  }

  /**
   * Subscribe to traffic incidents updates
   */
  subscribeToTrafficIncidents(callback: (incidents: any[]) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'trafficIncidents'),
        orderBy('reportedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const incidents = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(incidents);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to traffic incidents:', error);
      throw error;
    }
  }

  /**
   * Subscribe to team member locations (real-time GPS tracking)
   */
  subscribeToTeamLocations(callback: (locations: any[]) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'team_locations'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const locations = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        callback(locations);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to team locations:', error);
      throw error;
    }
  }

  /**
   * Subscribe to team members (real-time status tracking)
   */
  subscribeToTeamMembers(callback: (members: any[]) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'team_members'),
        orderBy('lastSeen', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const members = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          lastSeen: doc.data().lastSeen?.toDate() || new Date(),
        }));
        callback(members);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to team members:', error);
      throw error;
    }
  }

  /**
   * Subscribe to venue layout updates (real-time multi-user collaboration)
   */
  subscribeToVenueLayout(eventId: string, callback: (layout: any) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const docRef = doc(this.db, 'venues', eventId);

      const unsubscribe = onSnapshot(docRef, (docSnapshot: any) => {
        if (docSnapshot.exists()) {
          callback(docSnapshot.data());
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to venue layout:', error);
      throw error;
    }
  }

  /**
   * Subscribe to attendee reports (real-time report submissions and validations)
   */
  subscribeToAttendeeReports(callback: (reports: any[]) => void): () => void {
    if (!this.db) throw new Error('Firebase not initialized');

    try {
      const q = query(
        collection(this.db, 'attendee_reports'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const reports = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        }));
        callback(reports);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[Firebase] Failed to subscribe to attendee reports:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.initialized) {
      console.warn('[Firebase] Not initialized');
      return false;
    }

    try {
      // Simple connectivity check
      if (this.db) {
        const testDoc = doc(this.db, '_health', 'check');
        await setDoc(testDoc, { timestamp: Timestamp.now() });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Firebase] Health check failed:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
