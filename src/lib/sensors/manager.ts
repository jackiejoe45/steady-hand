import type { TiltSample } from "@/lib/game/constants";
import { requestSensorPermissions } from "./permissions";

export interface MotionReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface SensorState {
  sample: TiltSample | null;
  latestRms: number;
  orientationActive: boolean;
  motionActive: boolean;
  portraitValid: boolean;
  /** Which API last supplied orientation */
  orientationSource: "none" | "legacy" | "generic";
  /** Which API last supplied motion */
  motionSource: "none" | "legacy" | "generic";
  /** @deprecated use orientationSource / motionSource */
  source: "none" | "legacy" | "generic";
}

type Listener = (state: SensorState) => void;

const defaultState: SensorState = {
  sample: null,
  latestRms: 0,
  orientationActive: false,
  motionActive: false,
  portraitValid: true,
  orientationSource: "none",
  motionSource: "none",
  source: "none",
};

// Generic Sensor API types (Chrome Android)
interface SensorWithReading extends EventTarget {
  start: () => void;
  stop: () => void;
  addEventListener: (type: "reading" | "error", listener: () => void) => void;
}

interface AccelSensor extends SensorWithReading {
  x?: number;
  y?: number;
  z?: number;
}

interface GyroSensor extends SensorWithReading {
  x?: number;
  y?: number;
  z?: number;
}

interface OrientSensor extends SensorWithReading {
  quaternion?: number[];
}

function isPortraitValid(pitch: number): boolean {
  return Math.abs(pitch - 90) <= 30;
}

function tiltFromAccelerometer(x: number, y: number, z: number): TiltSample {
  // Convert gravity vector to pitch/roll (degrees), aligned with DeviceOrientation beta/gamma
  const pitch = Math.atan2(y, Math.hypot(x, z)) * (180 / Math.PI);
  const roll = Math.atan2(-x, Math.hypot(y, z)) * (180 / Math.PI);
  return { timestamp: Date.now(), pitch, roll };
}

function quaternionToTilt(q: number[]): TiltSample | null {
  if (q.length < 4) return null;
  const [qx, qy, qz, qw] = q;
  const pitch =
    Math.asin(Math.max(-1, Math.min(1, 2 * (qw * qy - qz * qx)))) *
    (180 / Math.PI);
  const roll =
    Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy)) *
    (180 / Math.PI);
  return { timestamp: Date.now(), pitch, roll };
}

class SensorManager {
  private attached = false;
  private listeners = new Set<Listener>();
  private state: SensorState = { ...defaultState };
  private readings: MotionReading[] = [];
  private prevAccel: { x: number; y: number; z: number } | null = null;
  private prevOrientation: TiltSample | null = null;
  private orientationEventCount = 0;
  private motionEventCount = 0;
  private watchdog: number | null = null;
  /** When legacy deviceorientation is active, ignore generic orientation updates */
  private lastLegacyOrientAt = 0;
  private genericOrientationStopped = false;

  private accelSensor: AccelSensor | null = null;
  private gyroSensor: GyroSensor | null = null;
  private orientSensor: OrientSensor | null = null;

  private shouldAcceptOrientation(source: "legacy" | "generic"): boolean {
    if (source === "generic") {
      // Legacy beta/gamma matches game math; generic quaternion/accel use different frames
      if (this.lastLegacyOrientAt > 0) return false;
    }
    return true;
  }

  private stopGenericOrientation() {
    if (this.genericOrientationStopped) return;
    this.genericOrientationStopped = true;

    if (this.orientSensor) {
      try {
        this.orientSensor.stop();
      } catch {
        // ignore
      }
      this.orientSensor = null;
    }
  }

  private updateOrientation(sample: TiltSample, source: "legacy" | "generic") {
    if (!this.shouldAcceptOrientation(source)) return;

    if (source === "legacy") {
      this.lastLegacyOrientAt = Date.now();
      if (!this.genericOrientationStopped && this.orientSensor) {
        this.stopGenericOrientation();
      }
    }

    this.orientationEventCount += 1;
    this.state = {
      ...this.state,
      sample,
      orientationActive: true,
      portraitValid: isPortraitValid(sample.pitch),
      orientationSource: source,
      source,
    };

    if (this.prevOrientation) {
      const dp = sample.pitch - this.prevOrientation.pitch;
      const dr = sample.roll - this.prevOrientation.roll;
      const delta = Math.hypot(dp, dr);
      if (delta > 0.15) {
        this.state = {
          ...this.state,
          latestRms: Math.max(this.state.latestRms, delta * 3),
        };
      }
    }
    this.prevOrientation = sample;
    this.notify();
  }

  private updateMotion(x: number, y: number, z: number, source: "legacy" | "generic") {
    this.motionEventCount += 1;
    this.state = {
      ...this.state,
      motionActive: true,
      motionSource: source,
    };

    this.readings.push({ x, y, z, timestamp: Date.now() });
    const cutoff = Date.now() - 3000;
    this.readings = this.readings.filter((r) => r.timestamp >= cutoff);

    const recent = this.readings.slice(-30);
    if (recent.length > 0) {
      const sumSq = recent.reduce(
        (acc, r) => acc + r.x ** 2 + r.y ** 2 + r.z ** 2,
        0,
      );
      this.state = {
        ...this.state,
        latestRms: Math.max(this.state.latestRms, Math.sqrt(sumSq / recent.length)),
      };
    }
    this.notify();
  }

  private orientationHandler = (e: DeviceOrientationEvent) => {
    const pitch = e.beta;
    const roll = e.gamma;
    if (pitch == null || roll == null || Number.isNaN(pitch) || Number.isNaN(roll)) {
      return;
    }
    this.updateOrientation({ timestamp: Date.now(), pitch, roll }, "legacy");
  };

  private motionHandler = (e: DeviceMotionEvent) => {
    const linear = e.acceleration;
    const withGravity = e.accelerationIncludingGravity;
    const rotation = e.rotationRate;

    if (linear && (linear.x != null || linear.y != null || linear.z != null)) {
      this.updateMotion(linear.x ?? 0, linear.y ?? 0, linear.z ?? 0, "legacy");
    } else if (
      withGravity &&
      (withGravity.x != null || withGravity.y != null || withGravity.z != null)
    ) {
      const x = withGravity.x ?? 0;
      const y = withGravity.y ?? 0;
      const z = withGravity.z ?? 0;
      if (this.prevAccel) {
        const dx = x - this.prevAccel.x;
        const dy = y - this.prevAccel.y;
        const dz = z - this.prevAccel.z;
        this.updateMotion(dx, dy, dz, "legacy");
      }
      this.prevAccel = { x, y, z };
    } else if (
      rotation &&
      (rotation.alpha != null || rotation.beta != null || rotation.gamma != null)
    ) {
      this.updateMotion(
        rotation.alpha ?? 0,
        rotation.beta ?? 0,
        rotation.gamma ?? 0,
        "legacy",
      );
    }
  };

  private onAccelReading = () => {
    if (!this.accelSensor) return;
    const x = this.accelSensor.x ?? 0;
    const y = this.accelSensor.y ?? 0;
    const z = this.accelSensor.z ?? 0;

    if (this.prevAccel) {
      const dx = x - this.prevAccel.x;
      const dy = y - this.prevAccel.y;
      const dz = z - this.prevAccel.z;
      this.updateMotion(dx, dy, dz, "generic");
    }
    this.prevAccel = { x, y, z };

    if (!this.orientSensor && this.lastLegacyOrientAt === 0) {
      this.updateOrientation(tiltFromAccelerometer(x, y, z), "generic");
    }
  };

  private onGyroReading = () => {
    if (!this.gyroSensor) return;
    this.updateMotion(
      this.gyroSensor.x ?? 0,
      this.gyroSensor.y ?? 0,
      this.gyroSensor.z ?? 0,
      "generic",
    );
  };

  private onOrientReading = () => {
    if (!this.orientSensor?.quaternion) return;
    const sample = quaternionToTilt(this.orientSensor.quaternion);
    if (sample) this.updateOrientation(sample, "generic");
  };

  /** Sync: attach legacy DOM event listeners (call inside tap handler). */
  attachLegacy() {
    if (typeof window === "undefined") return;

    window.addEventListener("deviceorientation", this.orientationHandler, {
      passive: true,
    });
    window.addEventListener("deviceorientationabsolute", this.orientationHandler, {
      passive: true,
    });
    window.addEventListener("devicemotion", this.motionHandler, {
      passive: true,
    });
  }

  /** Async: start Generic Sensor API (Chrome Android). Call after permissions. */
  async startGenericSensors(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const win = window as Window & {
      Accelerometer?: new (opts: { frequency: number }) => AccelSensor;
      Gyroscope?: new (opts: { frequency: number }) => GyroSensor;
      AbsoluteOrientationSensor?: new (opts: {
        frequency: number;
      }) => OrientSensor;
      RelativeOrientationSensor?: new (opts: {
        frequency: number;
      }) => OrientSensor;
    };

    let started = false;

    try {
      if (win.Accelerometer) {
        this.accelSensor = new win.Accelerometer({ frequency: 60 });
        this.accelSensor.addEventListener("reading", this.onAccelReading);
        this.accelSensor.start();
        started = true;
      }
    } catch {
      this.accelSensor = null;
    }

    try {
      if (win.Gyroscope) {
        this.gyroSensor = new win.Gyroscope({ frequency: 60 });
        this.gyroSensor.addEventListener("reading", this.onGyroReading);
        this.gyroSensor.start();
        started = true;
      }
    } catch {
      this.gyroSensor = null;
    }

    try {
      const OrientCtor =
        win.RelativeOrientationSensor ?? win.AbsoluteOrientationSensor;
      if (OrientCtor) {
        this.orientSensor = new OrientCtor({ frequency: 60 });
        this.orientSensor.addEventListener("reading", this.onOrientReading);
        this.orientSensor.start();
        started = true;
      }
    } catch {
      this.orientSensor = null;
    }

    return started;
  }

  /** Full activation: legacy sync + permissions + generic sensors. */
  activate(): void {
    if (this.attached) return;
    this.attached = true;
    this.orientationEventCount = 0;
    this.motionEventCount = 0;
    this.lastLegacyOrientAt = 0;
    this.genericOrientationStopped = false;

    // Sync — must run in user gesture call stack
    this.attachLegacy();

    void requestSensorPermissions().then(() => this.startGenericSensors());

    this.watchdog = window.setInterval(() => {
      const orientationActive = this.orientationEventCount > 0;
      const motionActive = this.motionEventCount > 0;
      const latestRms =
        this.motionEventCount === 0 && this.orientationEventCount === 0
          ? this.state.latestRms * 0.85
          : this.state.latestRms;

      const changed =
        orientationActive !== this.state.orientationActive ||
        motionActive !== this.state.motionActive ||
        latestRms !== this.state.latestRms;

      this.orientationEventCount = 0;
      this.motionEventCount = 0;

      if (!changed) return;

      this.state = {
        ...this.state,
        orientationActive,
        motionActive,
        latestRms,
      };
      this.notify();
    }, 500);
  }

  /** @deprecated use activate() */
  attach() {
    this.activate();
  }

  detach() {
    if (!this.attached || typeof window === "undefined") return;
    this.attached = false;

    window.removeEventListener("deviceorientation", this.orientationHandler);
    window.removeEventListener("deviceorientationabsolute", this.orientationHandler);
    window.removeEventListener("devicemotion", this.motionHandler);

    for (const sensor of [
      this.accelSensor,
      this.gyroSensor,
      this.orientSensor,
    ]) {
      try {
        sensor?.stop();
      } catch {
        // ignore
      }
    }
    this.accelSensor = null;
    this.gyroSensor = null;
    this.orientSensor = null;
    this.lastLegacyOrientAt = 0;
    this.genericOrientationStopped = false;

    if (this.watchdog) {
      window.clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  clearReadings() {
    this.readings = [];
    this.prevAccel = null;
    this.prevOrientation = null;
    this.state = {
      ...this.state,
      sample: null,
      latestRms: 0,
    };
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const sensorManager = new SensorManager();
