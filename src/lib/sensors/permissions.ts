type SensorPermissionCtor = {
  requestPermission?: () => Promise<PermissionState>;
};

export async function requestSensorPermissions(): Promise<boolean> {
  const orientationCtor = DeviceOrientationEvent as typeof DeviceOrientationEvent &
    SensorPermissionCtor;
  const motionCtor = DeviceMotionEvent as typeof DeviceMotionEvent &
    SensorPermissionCtor;

  const needsOrientation =
    typeof orientationCtor.requestPermission === "function";
  const needsMotion = typeof motionCtor.requestPermission === "function";

  // iOS: both prompts must be triggered directly from the user gesture handler.
  const permissionRequests: Promise<boolean>[] = [];

  if (needsOrientation) {
    permissionRequests.push(
      orientationCtor
        .requestPermission!()
        .then((state) => state === "granted")
        .catch(() => false),
    );
  }

  if (needsMotion) {
    permissionRequests.push(
      motionCtor
        .requestPermission!()
        .then((state) => state === "granted")
        .catch(() => false),
    );
  }

  if (permissionRequests.length > 0) {
    const results = await Promise.all(permissionRequests);
    if (!results.every(Boolean)) return false;
  }

  // Android Chrome Permissions API fallback
  if ("permissions" in navigator) {
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

  return true;
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
