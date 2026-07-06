type SensorPermissionCtor = {
  requestPermission?: () => Promise<PermissionState>;
};

export async function requestSensorPermissions(): Promise<boolean> {
  const orientationCtor = DeviceOrientationEvent as typeof DeviceOrientationEvent &
    SensorPermissionCtor;
  const motionCtor = DeviceMotionEvent as typeof DeviceMotionEvent &
    SensorPermissionCtor;

  let orientationOk = true;
  let motionOk = true;

  if (typeof orientationCtor.requestPermission === "function") {
    try {
      orientationOk =
        (await orientationCtor.requestPermission()) === "granted";
    } catch {
      orientationOk = false;
    }
  }

  if (typeof motionCtor.requestPermission === "function") {
    try {
      motionOk = (await motionCtor.requestPermission()) === "granted";
    } catch {
      motionOk = false;
    }
  }

  // Android Chrome Permissions API fallback
  if (orientationOk && motionOk && "permissions" in navigator) {
    for (const name of ["accelerometer", "gyroscope"] as const) {
      try {
        const status = await navigator.permissions.query({
          name: name as PermissionName,
        });
        if (status.state === "denied") {
          return false;
        }
      } catch {
        // Permissions API name not supported — ignore
      }
    }
  }

  return orientationOk && motionOk;
}

export function sensorsNeedPermission(): boolean {
  const orientationCtor = DeviceOrientationEvent as typeof DeviceOrientationEvent &
    SensorPermissionCtor;
  const motionCtor = DeviceMotionEvent as typeof DeviceMotionEvent &
    SensorPermissionCtor;

  return (
    typeof orientationCtor.requestPermission === "function" ||
    typeof motionCtor.requestPermission === "function"
  );
}

export function hasOrientationSupport(): boolean {
  return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
}

export function hasMotionSupport(): boolean {
  return typeof window !== "undefined" && "DeviceMotionEvent" in window;
}
