import { GAME_CONFIG, type Axis, type TiltSample } from "./constants";

function getTiltValue(sample: TiltSample, axis: Axis): number {
  return axis === "pitch" ? sample.pitch : sample.roll;
}

self.onmessage = (event: MessageEvent) => {
  const { samples, target, axis } = event.data as {
    samples: TiltSample[];
    target: number;
    axis: Axis;
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const tolerance = GAME_CONFIG.tolerance;
  const driftWeight = GAME_CONFIG.driftWeight;

  for (const sample of samples) {
    const value = getTiltValue(sample, axis);
    const deviation = Math.abs(value - target);
    const weight = deviation <= tolerance ? 1 : driftWeight;
    weightedSum += deviation * weight;
    totalWeight += weight;
  }

  const mad =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : 999;

  self.postMessage({ mad });
};

export {};
