/**
 * AR Overlay Service
 * 
 * Augmented Reality overlays for drone video feeds
 * Displays crowd density heatmaps, incident markers, and team locations
 * Uses THREE.js for 3D rendering
 */

// If you see a module not found error for 'three', run: npm install three @types/three
import * as THREE from 'three';

export interface ARMarker {
  id: string;
  type: 'incident' | 'team_member' | 'poi' | 'hazard';
  position: { x: number; y: number; z: number };
  label: string;
  color: string;
  icon?: string;
  data?: any;
}

export interface HeatmapData {
  points: Array<{
    x: number;
    y: number;
    intensity: number; // 0-1
  }>;
  gradient: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
}

export interface AROverlayConfig {
  showHeatmap: boolean;
  showIncidents: boolean;
  showTeamMembers: boolean;
  showPOIs: boolean;
  opacity: number;
  updateInterval: number; // ms
}

export class AROverlayService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private markers: Map<string, THREE.Object3D> = new Map();
  private heatmapMesh?: THREE.Mesh;
  private config: AROverlayConfig;
  private animationId?: number;

  constructor(canvas: HTMLCanvasElement, config: Partial<AROverlayConfig> = {}) {
    this.config = {
      showHeatmap: true,
      showIncidents: true,
      showTeamMembers: true,
      showPOIs: true,
      opacity: 0.7,
      updateInterval: 1000,
      ...config
    };

    // Initialize THREE.js scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // Transparent background for overlay
      antialias: true
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x000000, 0); // Transparent

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
  }

  /**
   * Start rendering AR overlays
   */
  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Rotate markers for visibility
      this.markers.forEach(marker => {
        marker.rotation.y += 0.01;
      });

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Stop rendering
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Add crowd density heatmap overlay
   */
  addHeatmap(data: HeatmapData): void {
    if (!this.config.showHeatmap) return;

    // Remove existing heatmap
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh);
    }

    // Create heatmap geometry
    const geometry = new THREE.PlaneGeometry(100, 100, data.points.length, data.points.length);
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    // Apply height and color based on intensity
    data.points.forEach((point, i) => {
      const index = i * 3;
      positions[index] = point.x;
      positions[index + 1] = point.y;
      positions[index + 2] = point.intensity * 10; // Height based on crowd density

      // Color based on intensity
      const color = this.getHeatmapColor(point.intensity, data.gradient);
      const threeColor = new THREE.Color(color);
      colors[index] = threeColor.r;
      colors[index + 1] = threeColor.g;
      colors[index + 2] = threeColor.b;
    });

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material with vertex colors
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.config.opacity,
      side: THREE.DoubleSide
    });

    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.heatmapMesh);
  }

  /**
   * Get color for heatmap based on intensity
   */
  private getHeatmapColor(intensity: number, gradient: HeatmapData['gradient']): string {
    if (intensity < 0.25) return gradient.low;
    if (intensity < 0.5) return gradient.medium;
    if (intensity < 0.75) return gradient.high;
    return gradient.critical;
  }

  /**
   * Add incident marker to AR view
   */
  addIncidentMarker(marker: ARMarker): void {
    if (!this.config.showIncidents && marker.type === 'incident') return;
    if (!this.config.showTeamMembers && marker.type === 'team_member') return;
    if (!this.config.showPOIs && marker.type === 'poi') return;

    // Remove existing marker if updating
    if (this.markers.has(marker.id)) {
      this.scene.remove(this.markers.get(marker.id)!);
    }

    // Create marker group
    const markerGroup = new THREE.Group();

    // Create marker geometry based on type
    let geometry: THREE.BufferGeometry;
    switch (marker.type) {
      case 'incident':
        geometry = new THREE.SphereGeometry(2, 16, 16);
        break;
      case 'team_member':
        geometry = new THREE.ConeGeometry(1.5, 3, 8);
        break;
      case 'poi':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'hazard':
        geometry = new THREE.TetrahedronGeometry(2);
        break;
      default:
        geometry = new THREE.SphereGeometry(1.5, 12, 12);
    }

    const material = new THREE.MeshStandardMaterial({
      color: marker.color,
      emissive: marker.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(marker.position.x, marker.position.y, marker.position.z);
    markerGroup.add(mesh);

    // Add text label
    const labelSprite = this.createTextLabel(marker.label, marker.color);
    labelSprite.position.set(marker.position.x, marker.position.y + 3, marker.position.z);
    markerGroup.add(labelSprite);

    // Add pulsing animation for incidents
    if (marker.type === 'incident' || marker.type === 'hazard') {
      this.addPulseAnimation(mesh);
    }

    this.markers.set(marker.id, markerGroup);
    this.scene.add(markerGroup);
  }

  /**
   * Create text label sprite
   */
  private createTextLabel(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 128;

    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.font = 'Bold 48px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);

    return sprite;
  }

  /**
   * Add pulsing animation to marker
   */
  private addPulseAnimation(mesh: THREE.Mesh): void {
    const originalScale = mesh.scale.clone();
    let growing = true;

    const pulse = () => {
      if (growing) {
        mesh.scale.multiplyScalar(1.01);
        if (mesh.scale.x > originalScale.x * 1.3) {
          growing = false;
        }
      } else {
        mesh.scale.multiplyScalar(0.99);
        if (mesh.scale.x < originalScale.x) {
          growing = true;
        }
      }

      requestAnimationFrame(pulse);
    };

    pulse();
  }

  /**
   * Remove marker from AR view
   */
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      this.scene.remove(marker);
      this.markers.delete(markerId);
    }
  }

  /**
   * Update marker position (for moving team members)
   */
  updateMarkerPosition(markerId: string, position: { x: number; y: number; z: number }): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      this.scene.remove(marker);
    });
    this.markers.clear();
  }

  /**
   * Update camera position (follows drone movement)
   */
  updateCamera(position: { x: number; y: number; z: number }, lookAt: { x: number; y: number; z: number }): void {
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));
  }

  /**
   * Toggle overlay visibility
   */
  setVisibility(type: keyof AROverlayConfig, visible: boolean): void {
    if (type in this.config) {
      (this.config as any)[type] = visible;

      // Update marker visibility
      // Optionally, update marker visibility here if needed based on config
    }
  }

  /**
   * Set overlay opacity
   */
  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));

    // Update all materials
    if (this.heatmapMesh) {
      (this.heatmapMesh.material as THREE.Material).opacity = this.config.opacity;
    }

    this.markers.forEach(marker => {
      marker.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.Material).opacity = this.config.opacity * 0.9;
        }
      });
    });
  }

  /**
   * Resize renderer (when video size changes)
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Take screenshot of AR view
   */
  captureScreenshot(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    this.clearMarkers();

    if (this.heatmapMesh) {
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
  }
}

export default AROverlayService;
