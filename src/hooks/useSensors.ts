"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TiltSample } from "@/lib/game/constants";
import { sensorManager } from "@/lib/sensors/manager";
import { sensorsNeedPermission } from "@/lib/sensors/permissions";

function setIfChanged<T>(setter: (v: T) => void, next: T, prev: T) {
  if (next !== prev) setter(next);
}

export function useSensors() {
  const [sample, setSample] = useState<TiltSample | null>(null);
  const [latestRms, setLatestRms] = useState(0);
  const [orientationActive, setOrientationActive] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  const [portraitValid, setPortraitValid] = useState(true);
  const [source, setSource] = useState<"none" | "legacy" | "generic">("none");
  const [orientationSource, setOrientationSource] = useState<
    "none" | "legacy" | "generic"
  >("none");
  const [motionSource, setMotionSource] = useState<
    "none" | "legacy" | "generic"
  >("none");
  const [needsPermission, setNeedsPermission] = useState(false);
  const [active, setActive] = useState(false);

  const snapshotRef = useRef({
    sampleTimestamp: 0,
    latestRms: 0,
    orientationActive: false,
    motionActive: false,
    portraitValid: true,
    source: "none" as "none" | "legacy" | "generic",
    orientationSource: "none" as "none" | "legacy" | "generic",
    motionSource: "none" as "none" | "legacy" | "generic",
  });

  useEffect(() => {
    setNeedsPermission(sensorsNeedPermission());
  }, []);

  useEffect(() => {
    return sensorManager.subscribe((state) => {
      const snap = snapshotRef.current;
      const sampleTimestamp = state.sample?.timestamp ?? 0;

      if (sampleTimestamp !== snap.sampleTimestamp) {
        snap.sampleTimestamp = sampleTimestamp;
        setSample(state.sample);
      }

      setIfChanged(setLatestRms, state.latestRms, snap.latestRms);
      snap.latestRms = state.latestRms;

      setIfChanged(
        setOrientationActive,
        state.orientationActive,
        snap.orientationActive,
      );
      snap.orientationActive = state.orientationActive;

      setIfChanged(setMotionActive, state.motionActive, snap.motionActive);
      snap.motionActive = state.motionActive;

      setIfChanged(setPortraitValid, state.portraitValid, snap.portraitValid);
      snap.portraitValid = state.portraitValid;

      setIfChanged(setSource, state.source, snap.source);
      snap.source = state.source;

      setIfChanged(
        setOrientationSource,
        state.orientationSource,
        snap.orientationSource,
      );
      snap.orientationSource = state.orientationSource;

      setIfChanged(setMotionSource, state.motionSource, snap.motionSource);
      snap.motionSource = state.motionSource;
    });
  }, []);

  /** Request permissions (must run from a user gesture), then activate. */
  const startSensors = useCallback(async (): Promise<boolean> => {
    const granted = await sensorManager.ensurePermissionsAndActivate();
    setActive(granted);
    return granted;
  }, []);

  const stopSensors = useCallback(() => {
    sensorManager.detach();
    setActive(false);
  }, []);

  const clearReadings = useCallback(() => {
    sensorManager.clearReadings();
  }, []);

  const requestPermission = useCallback(async () => {
    return startSensors();
  }, [startSensors]);

  return {
    sample,
    latestRms,
    orientationActive,
    motionActive,
    portraitValid,
    source,
    orientationSource,
    motionSource,
    needsPermission,
    active,
    startSensors,
    stopSensors,
    clearReadings,
    requestPermission,
  };
}

export type { MotionReading } from "@/lib/sensors/manager";
