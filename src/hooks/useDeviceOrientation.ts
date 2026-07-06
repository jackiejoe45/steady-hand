"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type TiltSample } from "@/lib/game/constants";
import { isPortraitValid } from "@/lib/game/scoring";
import {
  requestSensorPermissions,
  sensorsNeedPermission,
} from "@/lib/sensors/permissions";

export interface MotionReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

function parseOrientation(e: DeviceOrientationEvent): TiltSample | null {
  const pitch = e.beta;
  const roll = e.gamma;

  if (pitch == null || roll == null || Number.isNaN(pitch) || Number.isNaN(roll)) {
    return null;
  }

  return { timestamp: Date.now(), pitch, roll };
}

export function useDeviceOrientation(enabled: boolean) {
  const [sample, setSample] = useState<TiltSample | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [portraitValid, setPortraitValid] = useState(true);
  const [receivingEvents, setReceivingEvents] = useState(false);
  const eventCountRef = useRef(0);

  const requestPermission = useCallback(async () => {
    const granted = await requestSensorPermissions();
    if (granted) {
      setPermissionGranted(true);
      setNeedsPermission(false);
    }
    return granted;
  }, []);

  useEffect(() => {
    setNeedsPermission(sensorsNeedPermission());
    if (!sensorsNeedPermission()) {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !permissionGranted) return;

    eventCountRef.current = 0;

    const handler = (e: DeviceOrientationEvent) => {
      const parsed = parseOrientation(e);
      if (!parsed) return;
      eventCountRef.current += 1;
      setReceivingEvents(true);
      setSample(parsed);
      setPortraitValid(isPortraitValid(parsed.pitch));
    };

    window.addEventListener("deviceorientation", handler, { passive: true });
    window.addEventListener("deviceorientationabsolute", handler, {
      passive: true,
    });

    const watchdog = window.setInterval(() => {
      if (eventCountRef.current === 0) {
        setReceivingEvents(false);
      }
      eventCountRef.current = 0;
    }, 1000);

    return () => {
      window.removeEventListener("deviceorientation", handler);
      window.removeEventListener("deviceorientationabsolute", handler);
      window.clearInterval(watchdog);
    };
  }, [enabled, permissionGranted]);

  return {
    sample,
    permissionGranted,
    needsPermission,
    requestPermission,
    portraitValid,
    receivingEvents,
  };
}

export function useDeviceMotion(enabled: boolean) {
  const readingsRef = useRef<MotionReading[]>([]);
  const prevAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const [latestRms, setLatestRms] = useState(0);
  const [receivingEvents, setReceivingEvents] = useState(false);
  const eventCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    eventCountRef.current = 0;

    const handler = (e: DeviceMotionEvent) => {
      eventCountRef.current += 1;
      setReceivingEvents(true);

      const linear = e.acceleration;
      const withGravity = e.accelerationIncludingGravity;
      const rotation = e.rotationRate;

      let motionValue = 0;

      if (linear && (linear.x != null || linear.y != null || linear.z != null)) {
        const x = linear.x ?? 0;
        const y = linear.y ?? 0;
        const z = linear.z ?? 0;
        readingsRef.current.push({ x, y, z, timestamp: Date.now() });
        motionValue = Math.sqrt(x * x + y * y + z * z);
      } else if (
        withGravity &&
        (withGravity.x != null || withGravity.y != null || withGravity.z != null)
      ) {
        const x = withGravity.x ?? 0;
        const y = withGravity.y ?? 0;
        const z = withGravity.z ?? 0;
        if (prevAccelRef.current) {
          const dx = x - prevAccelRef.current.x;
          const dy = y - prevAccelRef.current.y;
          const dz = z - prevAccelRef.current.z;
          motionValue = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        prevAccelRef.current = { x, y, z };
      } else if (
        rotation &&
        (rotation.alpha != null || rotation.beta != null || rotation.gamma != null)
      ) {
        const alpha = rotation.alpha ?? 0;
        const beta = rotation.beta ?? 0;
        const gamma = rotation.gamma ?? 0;
        motionValue = Math.sqrt(alpha * alpha + beta * beta + gamma * gamma);
      }

      const cutoff = Date.now() - 3000;
      readingsRef.current = readingsRef.current.filter(
        (r) => r.timestamp >= cutoff,
      );

      const recent = readingsRef.current.slice(-30);
      if (recent.length > 0) {
        const sumSq = recent.reduce(
          (acc, r) => acc + r.x ** 2 + r.y ** 2 + r.z ** 2,
          0,
        );
        setLatestRms(Math.sqrt(sumSq / recent.length));
      } else if (motionValue > 0) {
        setLatestRms(motionValue);
      }
    };

    window.addEventListener("devicemotion", handler, { passive: true });

    const watchdog = window.setInterval(() => {
      if (eventCountRef.current === 0) {
        setReceivingEvents(false);
      }
      eventCountRef.current = 0;
    }, 1000);

    return () => {
      window.removeEventListener("devicemotion", handler);
      window.clearInterval(watchdog);
      prevAccelRef.current = null;
    };
  }, [enabled]);

  const getReadings = useCallback(() => readingsRef.current, []);
  const clearReadings = useCallback(() => {
    readingsRef.current = [];
    prevAccelRef.current = null;
    setLatestRms(0);
  }, []);

  return { latestRms, getReadings, clearReadings, receivingEvents };
}
