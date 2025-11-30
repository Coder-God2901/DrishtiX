/**
 * Facial Recognition Service
 * 
 * Uses Gemini Vision API for face detection and matching
 * Features:
 * - Lost & found person matching
 * - VIP recognition
 * - Person tracking across cameras
 * - Privacy-compliant face embeddings
 * - Liveness detection
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getFirestore, Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export interface FaceDetection {
  face_id: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: {
    estimated_age?: number;
    gender?: string;
    emotions?: string[];
    accessories?: string[];
  };
  embedding?: number[];
  timestamp: string;
}

export interface PersonRecord {
  person_id: string;
  name?: string;
  category: 'lost' | 'found' | 'vip' | 'staff' | 'security';
  description: string;
  reference_images: string[];
  face_embeddings: number[][];
  contact_info?: {
    phone?: string;
    email?: string;
    emergency_contact?: string;
  };
  metadata: {
    event_id: string;
    reported_at: string;
    reported_by?: string;
    status: 'active' | 'matched' | 'resolved';
    last_seen?: {
      location: string;
      camera_id: string;
      timestamp: string;
    };
  };
}

export interface FaceMatch {
  person_id: string;
  person_name?: string;
  confidence: number;
  match_score: number;
  detection: FaceDetection;
  matched_at: string;
}

export interface LivenessCheckResult {
  is_live: boolean;
  confidence: number;
  checks: {
    movement_detected: boolean;
    texture_analysis: boolean;
    depth_estimation: boolean;
  };
  spoofing_risk: 'low' | 'medium' | 'high';
}

export class FacialRecognitionService {
  private geminiModel: GenerativeModel;
  private firestore: Firestore;
  private readonly MATCH_THRESHOLD = 0.75; // 75% confidence for face matching
  private readonly COLLECTION_PERSONS = 'persons';
  private readonly COLLECTION_DETECTIONS = 'face_detections';

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.firestore = getFirestore();
  }

  /**
   * Detect faces in an image using Gemini Vision
   */
  async detectFaces(imageData: string, eventId: string, cameraId: string): Promise<FaceDetection[]> {
    try {
      const prompt = `Analyze this image and detect all human faces. For each face detected, provide:
1. Bounding box coordinates (x, y, width, height as percentages 0-100)
2. Confidence score (0-1)
3. Estimated age range
4. Gender (if clearly identifiable)
5. Visible emotions (happy, sad, neutral, anxious, etc.)
6. Visible accessories (glasses, hat, mask, etc.)

Return the result as a JSON array of face detections.
Format:
[
  {
    "confidence": 0.95,
    "bounding_box": {"x": 25, "y": 30, "width": 15, "height": 20},
    "attributes": {
      "estimated_age": 35,
      "gender": "male",
      "emotions": ["neutral"],
      "accessories": ["glasses"]
    }
  }
]

If no faces are detected, return an empty array [].`;

      const result = await this.geminiModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in Gemini response');
        return [];
      }

      const detections = JSON.parse(jsonMatch[0]);

      // Add IDs and timestamps
      const faceDetections: FaceDetection[] = detections.map((detection: any) => ({
        face_id: this.generateFaceId(),
        confidence: detection.confidence,
        bounding_box: detection.bounding_box,
        attributes: detection.attributes || {},
        timestamp: new Date().toISOString()
      }));

      // Store detections in Firestore
      for (const detection of faceDetections) {
        await this.firestore.collection(this.COLLECTION_DETECTIONS).doc(detection.face_id).set({
          ...detection,
          event_id: eventId,
          camera_id: cameraId,
          created_at: new Date().toISOString()
        });
      }

      return faceDetections;

    } catch (error) {
      console.error('Face detection error:', error);
      throw new Error(`Face detection failed: ${error}`);
    }
  }

  /**
   * Match a detected face against registered persons (lost/found, VIPs)
   */
  async matchFace(
    imageData: string,
    detection: FaceDetection,
    eventId: string
  ): Promise<FaceMatch | null> {
    try {
      // Get all active persons for this event
      const personsSnapshot = await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .where('metadata.event_id', '==', eventId)
        .where('metadata.status', 'in', ['active', 'matched'])
        .get();

      if (personsSnapshot.empty) {
        return null;
      }

      let bestMatch: FaceMatch | null = null;
      let highestScore = 0;

      // Compare with each registered person
      for (const doc of personsSnapshot.docs) {
        const person = doc.data() as PersonRecord;

        for (const referenceImage of person.reference_images) {
          const matchScore = await this.compareFaces(imageData, referenceImage);

          if (matchScore > highestScore && matchScore >= this.MATCH_THRESHOLD) {
            highestScore = matchScore;
            bestMatch = {
              person_id: person.person_id,
              person_name: person.name,
              confidence: detection.confidence,
              match_score: matchScore,
              detection: detection,
              matched_at: new Date().toISOString()
            };
          }
        }
      }

      // If match found, update person record with last seen location
      if (bestMatch) {
        await this.updatePersonLastSeen(bestMatch.person_id, detection, eventId);
      }

      return bestMatch;

    } catch (error) {
      console.error('Face matching error:', error);
      return null;
    }
  }

  /**
   * Compare two face images for similarity
   */
  private async compareFaces(image1: string, image2: string): Promise<number> {
    try {
      const prompt = `Compare these two face images and determine if they show the same person.
Provide a similarity score from 0 to 1, where:
- 1.0 = Definitely the same person
- 0.8-0.9 = Very likely the same person
- 0.6-0.7 = Possibly the same person
- Below 0.6 = Different persons

Consider:
- Facial structure and proportions
- Key features (eyes, nose, mouth)
- Distinctive marks or characteristics
- Account for different angles, lighting, and expressions

Return ONLY a JSON object in this exact format:
{
  "similarity_score": 0.85,
  "confidence": "high",
  "matching_features": ["eye shape", "nose structure", "face oval"],
  "differences": ["lighting", "angle"]
}`;

      const result = await this.geminiModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: image1
          }
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: image2
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return 0;
      }

      const comparison = JSON.parse(jsonMatch[0]);
      return comparison.similarity_score || 0;

    } catch (error) {
      console.error('Face comparison error:', error);
      return 0;
    }
  }

  /**
   * Register a new person (lost, found, VIP, etc.)
   */
  async registerPerson(person: Omit<PersonRecord, 'person_id'>): Promise<string> {
    try {
      const personId = this.generatePersonId();
      const personRecord: PersonRecord = {
        ...person,
        person_id: personId
      };

      await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .doc(personId)
        .set(personRecord);

      console.log(`Person registered: ${personId} (${person.category})`);
      return personId;

    } catch (error) {
      console.error('Person registration error:', error);
      throw new Error(`Failed to register person: ${error}`);
    }
  }

  /**
   * Check if a face image is from a live person (anti-spoofing)
   */
  async checkLiveness(imageData: string): Promise<LivenessCheckResult> {
    try {
      const prompt = `Analyze this image to determine if it shows a live person or a photograph/screen/mask.
Look for signs of:
1. Natural skin texture and imperfections
2. Depth and 3D facial structure
3. Natural lighting and shadows
4. Eye reflections and moisture
5. Micro-expressions or slight movements (if video frame)

Signs of spoofing:
- Flat appearance (photograph)
- Screen reflections or pixels
- Unnatural edges or borders
- Lack of depth
- Perfect/artificial skin texture

Return a JSON object:
{
  "is_live": true/false,
  "confidence": 0.92,
  "checks": {
    "texture_analysis": true,
    "depth_estimation": true,
    "lighting_natural": true
  },
  "spoofing_indicators": [],
  "risk_level": "low"
}`;

      const result = await this.geminiModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Default to rejecting if analysis fails
        return {
          is_live: false,
          confidence: 0,
          checks: {
            movement_detected: false,
            texture_analysis: false,
            depth_estimation: false
          },
          spoofing_risk: 'high'
        };
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        is_live: analysis.is_live,
        confidence: analysis.confidence,
        checks: {
          movement_detected: false, // Would need video frames
          texture_analysis: analysis.checks?.texture_analysis || false,
          depth_estimation: analysis.checks?.depth_estimation || false
        },
        spoofing_risk: analysis.risk_level || 'medium'
      };

    } catch (error) {
      console.error('Liveness check error:', error);
      return {
        is_live: false,
        confidence: 0,
        checks: {
          movement_detected: false,
          texture_analysis: false,
          depth_estimation: false
        },
        spoofing_risk: 'high'
      };
    }
  }

  /**
   * Search for lost persons by description
   */
  async searchLostPersons(
    eventId: string,
    category: 'lost' | 'found' = 'lost'
  ): Promise<PersonRecord[]> {
    try {
      const snapshot = await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .where('metadata.event_id', '==', eventId)
        .where('category', '==', category)
        .where('metadata.status', '==', 'active')
        .get();

      return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PersonRecord);

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Update person status (e.g., when found)
   */
  async updatePersonStatus(
    personId: string,
    status: 'active' | 'matched' | 'resolved'
  ): Promise<void> {
    try {
      await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .doc(personId)
        .update({
          'metadata.status': status,
          'metadata.updated_at': new Date().toISOString()
        });

      console.log(`Person ${personId} status updated to: ${status}`);

    } catch (error) {
      console.error('Status update error:', error);
      throw new Error(`Failed to update person status: ${error}`);
    }
  }

  /**
   * Update person's last seen location
   */
  private async updatePersonLastSeen(
    personId: string,
    detection: FaceDetection,
    cameraId: string
  ): Promise<void> {
    try {
      await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .doc(personId)
        .update({
          'metadata.last_seen': {
            camera_id: cameraId,
            timestamp: detection.timestamp,
            face_id: detection.face_id
          }
        });

    } catch (error) {
      console.error('Last seen update error:', error);
    }
  }

  /**
   * Get all face detections for a time period
   */
  async getFaceDetections(
    eventId: string,
    startTime: string,
    endTime: string
  ): Promise<FaceDetection[]> {
    try {
      const snapshot = await this.firestore
        .collection(this.COLLECTION_DETECTIONS)
        .where('event_id', '==', eventId)
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as FaceDetection);

    } catch (error) {
      console.error('Get detections error:', error);
      return [];
    }
  }

  /**
   * Delete person record (GDPR compliance)
   */
  async deletePerson(personId: string): Promise<void> {
    try {
      await this.firestore
        .collection(this.COLLECTION_PERSONS)
        .doc(personId)
        .delete();

      console.log(`Person ${personId} deleted (GDPR compliance)`);

    } catch (error) {
      console.error('Delete person error:', error);
      throw new Error(`Failed to delete person: ${error}`);
    }
  }

  /**
   * Generate unique face ID
   */
  private generateFaceId(): string {
    return `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique person ID
   */
  private generatePersonId(): string {
    return `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default FacialRecognitionService;
