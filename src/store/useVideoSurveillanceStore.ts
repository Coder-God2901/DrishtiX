import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CameraStatus = 'online' | 'offline' | 'error' | 'recording' | 'maintenance';
export type CameraType = 'fixed' | 'ptz' | 'dome' | '360';

export interface Camera {
  id: string;
  name: string;
  description?: string;
  type: CameraType;
  status: CameraStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    zone?: string;
    floor?: string;
  };
  streamUrl: string;
  recordingUrl?: string;
  thumbnailUrl?: string;
  resolution: string; // e.g., "1920x1080"
  fps: number;
  capabilities: {
    ptz: boolean; // Pan-Tilt-Zoom
    audio: boolean;
    nightVision: boolean;
    motionDetection: boolean;
    analytics: boolean;
  };
  settings: {
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number; // degrees
  };
  coverage: {
    angle: number; // degrees
    range: number; // meters
    direction?: number; // degrees from north
  };
  alerts: boolean;
  recording: boolean;
  recordingSchedule?: {
    enabled: boolean;
    continuous: boolean;
    motionTriggered: boolean;
    schedule: {
      days: number[]; // 0-6 for Sun-Sat
      startTime: string; // HH:mm
      endTime: string; // HH:mm
    }[];
  };
  health: {
    uptime: number; // percentage
    lastPing?: Date;
    bandwidth: number; // Mbps
    storage: {
      used: number; // GB
      total: number; // GB
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoWall {
  id: string;
  name: string;
  description?: string;
  layout: {
    rows: number;
    columns: number;
  };
  cells: {
    row: number;
    column: number;
    cameraId?: string;
    span?: {
      rows: number;
      columns: number;
    };
  }[];
  active: boolean;
  fullscreen: boolean;
}

export interface Recording {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  size: number; // MB
  url: string;
  thumbnailUrl?: string;
  type: 'continuous' | 'motion' | 'event' | 'manual';
  eventId?: string;
  incidentId?: string;
  tags: string[];
  bookmarked: boolean;
  exported: boolean;
  retention: {
    expiresAt: Date;
    protected: boolean;
  };
}

export interface CameraPreset {
  id: string;
  cameraId: string;
  name: string;
  description?: string;
  position: {
    pan: number; // degrees
    tilt: number; // degrees
    zoom: number; // 1-10x
  };
}

export interface MotionEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  confidence: number; // 0-1
  zone?: string;
  thumbnailUrl?: string;
  videoClipUrl?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface VideoSurveillanceState {
  cameras: Camera[];
  videoWalls: VideoWall[];
  recordings: Recording[];
  presets: CameraPreset[];
  motionEvents: MotionEvent[];
  activeCameraId: string | null;
  activeVideoWallId: string | null;

  // Actions
  addCamera: (camera: Omit<Camera, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCamera: (id: string, updates: Partial<Camera>) => void;
  deleteCamera: (id: string) => void;

  setCameraStatus: (id: string, status: CameraStatus) => void;
  toggleRecording: (id: string) => void;

  addPreset: (preset: Omit<CameraPreset, 'id'>) => string;
  updatePreset: (id: string, updates: Partial<CameraPreset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (presetId: string) => void;

  addVideoWall: (wall: Omit<VideoWall, 'id'>) => string;
  updateVideoWall: (id: string, updates: Partial<VideoWall>) => void;
  deleteVideoWall: (id: string) => void;
  setActiveVideoWall: (id: string | null) => void;
  assignCameraToCell: (wallId: string, row: number, column: number, cameraId: string) => void;

  addRecording: (recording: Omit<Recording, 'id'>) => string;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  toggleBookmark: (id: string) => void;

  addMotionEvent: (event: Omit<MotionEvent, 'id'>) => string;
  acknowledgeMotionEvent: (id: string, userId: string) => void;

  setActiveCamera: (id: string | null) => void;

  getCamerasByZone: (zone: string) => Camera[];
  getCamerasByStatus: (status: CameraStatus) => Camera[];
  getRecordingsByCamera: (cameraId: string) => Recording[];
  getRecordingsByDateRange: (startDate: Date, endDate: Date) => Recording[];
}

export const useVideoSurveillanceStore = create<VideoSurveillanceState>()(
  persist(
    (set, get) => ({
      cameras: [],
      videoWalls: [],
      recordings: [],
      presets: [],
      motionEvents: [],
      activeCameraId: null,
      activeVideoWallId: null,

      addCamera: (camera) => {
        const id = `cam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newCamera: Camera = {
          ...camera,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          cameras: [...state.cameras, newCamera],
        }));

        return id;
      },

      updateCamera: (id, updates) => set((state) => ({
        cameras: state.cameras.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
        ),
      })),

      deleteCamera: (id) => set((state) => ({
        cameras: state.cameras.filter((c) => c.id !== id),
        activeCameraId: state.activeCameraId === id ? null : state.activeCameraId,
      })),

      setCameraStatus: (id, status) => set((state) => ({
        cameras: state.cameras.map((c) =>
          c.id === id ? { ...c, status, updatedAt: new Date() } : c
        ),
      })),

      toggleRecording: (id) => set((state) => ({
        cameras: state.cameras.map((c) =>
          c.id === id ? { ...c, recording: !c.recording, updatedAt: new Date() } : c
        ),
      })),

      addPreset: (preset) => {
        const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPreset: CameraPreset = {
          ...preset,
          id,
        };

        set((state) => ({
          presets: [...state.presets, newPreset],
        }));

        return id;
      },

      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),

      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
      })),

      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return;

        // In a real implementation, this would send PTZ commands to the camera
        console.log(`Applying preset ${preset.name} to camera ${preset.cameraId}`);
      },

      addVideoWall: (wall) => {
        const id = `wall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newWall: VideoWall = {
          ...wall,
          id,
        };

        set((state) => ({
          videoWalls: [...state.videoWalls, newWall],
        }));

        return id;
      },

      updateVideoWall: (id, updates) => set((state) => ({
        videoWalls: state.videoWalls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      })),

      deleteVideoWall: (id) => set((state) => ({
        videoWalls: state.videoWalls.filter((w) => w.id !== id),
        activeVideoWallId: state.activeVideoWallId === id ? null : state.activeVideoWallId,
      })),

      setActiveVideoWall: (id) => set({ activeVideoWallId: id }),

      assignCameraToCell: (wallId, row, column, cameraId) => set((state) => ({
        videoWalls: state.videoWalls.map((w) => {
          if (w.id === wallId) {
            const updatedCells = [...w.cells];
            const cellIndex = updatedCells.findIndex(
              (c) => c.row === row && c.column === column
            );

            if (cellIndex >= 0) {
              updatedCells[cellIndex] = { ...updatedCells[cellIndex], cameraId };
            } else {
              updatedCells.push({ row, column, cameraId });
            }

            return { ...w, cells: updatedCells };
          }
          return w;
        }),
      })),

      addRecording: (recording) => {
        const id = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRecording: Recording = {
          ...recording,
          id,
        };

        set((state) => ({
          recordings: [...state.recordings, newRecording],
        }));

        return id;
      },

      updateRecording: (id, updates) => set((state) => ({
        recordings: state.recordings.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),

      deleteRecording: (id) => set((state) => ({
        recordings: state.recordings.filter((r) => r.id !== id),
      })),

      toggleBookmark: (id) => set((state) => ({
        recordings: state.recordings.map((r) =>
          r.id === id ? { ...r, bookmarked: !r.bookmarked } : r
        ),
      })),

      addMotionEvent: (event) => {
        const id = `motion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newEvent: MotionEvent = {
          ...event,
          id,
        };

        set((state) => ({
          motionEvents: [newEvent, ...state.motionEvents].slice(0, 500), // Keep last 500
        }));

        return id;
      },

      acknowledgeMotionEvent: (id, userId) => set((state) => ({
        motionEvents: state.motionEvents.map((e) =>
          e.id === id
            ? {
              ...e,
              acknowledged: true,
              acknowledgedBy: userId,
              acknowledgedAt: new Date(),
            }
            : e
        ),
      })),

      setActiveCamera: (id) => set({ activeCameraId: id }),

      getCamerasByZone: (zone) => {
        return get().cameras.filter((c) => c.location.zone === zone);
      },

      getCamerasByStatus: (status) => {
        return get().cameras.filter((c) => c.status === status);
      },

      getRecordingsByCamera: (cameraId) => {
        return get().recordings.filter((r) => r.cameraId === cameraId);
      },

      getRecordingsByDateRange: (startDate, endDate) => {
        return get().recordings.filter(
          (r) => r.startTime >= startDate && r.startTime <= endDate
        );
      },
    }),
    {
      name: 'video-surveillance-storage',
      partialize: (state) => ({
        cameras: state.cameras,
        videoWalls: state.videoWalls,
        presets: state.presets,
      }),
    }
  )
);
