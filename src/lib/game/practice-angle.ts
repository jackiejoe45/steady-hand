import { GAME_CONFIG, type Axis } from "./constants";

export interface PracticeChallenge {
  angleDegrees: number;
  axis: Axis;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random angle/axis for practice — never matches the excluded daily challenge. */
export function generatePracticeChallenge(
  exclude: PracticeChallenge,
): PracticeChallenge {
  const { angleMin, angleMax } = GAME_CONFIG;
  const axes: Axis[] = ["pitch", "roll"];

  for (let attempt = 0; attempt < 30; attempt++) {
    const angleDegrees = randomInt(angleMin, angleMax);
    const axis = axes[Math.floor(Math.random() * axes.length)]!;
    if (
      angleDegrees !== exclude.angleDegrees ||
      axis !== exclude.axis
    ) {
      return { angleDegrees, axis };
    }
  }

  const angleDegrees =
    exclude.angleDegrees >= angleMax
      ? angleMin
      : exclude.angleDegrees + 1;
  const axis: Axis = exclude.axis === "pitch" ? "roll" : "pitch";
  return { angleDegrees, axis };
}
