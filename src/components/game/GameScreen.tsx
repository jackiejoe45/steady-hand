"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AngleReveal } from "@/components/game/AngleReveal";
import { Dial } from "@/components/game/Dial";
import { HoldTimer } from "@/components/game/HoldTimer";
import { ScoreCard } from "@/components/game/ScoreCard";
import { ShareCard } from "@/components/game/ShareCard";
import { ShakeGate } from "@/components/game/ShakeGate";
import { useAudioCues } from "@/hooks/useAudioCues";
import { useSensors } from "@/hooks/useSensors";
import { useGameEngine, type GamePhase } from "@/hooks/useGameEngine";
import type { Axis } from "@/lib/game/constants";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  generatePracticeChallenge,
  type PracticeChallenge,
} from "@/lib/game/practice-angle";
import { trackEvent } from "@/lib/analytics";

interface DailyAngle {
  date: string;
  angleDegrees: number;
  axis: Axis;
}

export function GameScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("mode") === "practice";

  const [dailyAngle, setDailyAngle] = useState<DailyAngle | null>(null);
  const [practiceChallenge, setPracticeChallenge] =
    useState<PracticeChallenge | null>(null);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    sample,
    latestRms,
    orientationActive,
    motionActive,
    portraitValid,
    source,
    orientationSource,
    motionSource,
    startSensors,
  } = useSensors();
  const { playCue, startShakeLoop } = useAudioCues();

  const handleComplete = useCallback(
    async (score: number, samples: { timestamp: number; pitch: number; roll: number }[]) => {
      playCue("complete");
      trackEvent("attempt_complete", { score, isPractice });

      if (isPractice) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            samples,
            deviceModel: navigator.userAgent.slice(0, 100),
            isPractice: false,
          }),
        });
        const data = await res.json();
        if (data.percentile) setPercentile(data.percentile);
      } catch {
        // Offline or unauthenticated
      } finally {
        setSubmitting(false);
      }
    },
    [isPractice, playCue],
  );

  const dailyExclude = dailyAngle
    ? { angleDegrees: dailyAngle.angleDegrees, axis: dailyAngle.axis }
    : null;

  const activeChallenge: PracticeChallenge | null = isPractice
    ? practiceChallenge
    : dailyExclude;

  const handlePhaseChange = useCallback(
    (phase: GamePhase) => {
      if (phase === "shakeGate") playCue("shake");
      if (phase === "angleReveal") playCue("reveal");
      if (phase === "hold") playCue("lock");
    },
    [playCue],
  );

  const engine = useGameEngine({
    targetAngle: activeChallenge?.angleDegrees ?? 45,
    axis: activeChallenge?.axis ?? "pitch",
    isPractice,
    sample,
    shakeRms: latestRms,
    portraitValid,
    onPhaseChange: handlePhaseChange,
    onComplete: handleComplete,
  });

  useEffect(() => {
    fetch("/api/daily-angle")
      .then((r) => r.json())
      .then(setDailyAngle)
      .catch(() => {
        const date = getUtcTodayDateStr();
        const { angle, axis } = computeDailyAngle(date);
        setDailyAngle({ date, angleDegrees: angle, axis });
      });
  }, []);

  const rollPracticeChallenge = useCallback((): PracticeChallenge => {
    const date = getUtcTodayDateStr();
    const daily = dailyExclude ?? {
      angleDegrees: computeDailyAngle(date).angle,
      axis: computeDailyAngle(date).axis,
    };
    const challenge = generatePracticeChallenge(daily);
    setPracticeChallenge(challenge);
    return challenge;
  }, [dailyExclude]);

  useEffect(() => {
    if (engine.phase === "shakeGate") return startShakeLoop();
  }, [engine.phase, startShakeLoop]);

  useEffect(() => {
    if (engine.phase === "hold" && !engine.inTolerance) playCue("drift");
  }, [engine.inTolerance, engine.phase, playCue]);

  const handleStart = async () => {
    const sensorsOk = await startSensors();
    if (!sensorsOk) return;

    if (isPractice) {
      const challenge = rollPracticeChallenge();
      engine.start({
        targetAngle: challenge.angleDegrees,
        axis: challenge.axis,
      });
    } else {
      engine.start();
    }
    trackEvent("game_start", { isPractice });
  };

  const handleShare = async () => {
    const text = `SteadyHand: ${engine.score?.toFixed(2)}° — Top ${percentile ?? "?"}% today. One angle. One shot.`;
    if (navigator.share) {
      await navigator.share({ title: "SteadyHand", text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    trackEvent("share_card", { score: engine.score });
  };

  if (!isPractice && !dailyAngle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500 font-mono animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 pb-24 pt-8 min-h-screen">
      {isPractice && (
        <span className="rounded-full bg-amber-900/50 text-amber-300 px-3 py-1 text-xs">
          Practice Mode
        </span>
      )}

      {engine.phase === "idle" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            {isPractice
              ? "Random challenge"
              : `Today's ${dailyAngle!.axis}`}
          </p>
          <span className="font-mono text-5xl text-zinc-600">??°</span>
          <button
            onClick={handleStart}
            className="rounded-2xl bg-[#4FC3F7] hover:bg-[#29B6F6] text-black px-12 py-4 text-xl font-bold transition-colors"
          >
            START
          </button>
        </div>
      )}

      {engine.phase === "shakeGate" && (
        <>
          <ShakeGate progress={engine.shakeProgress} />
          <div className="font-mono text-xs text-zinc-500 text-center space-y-1">
            <p>
              pitch {sample ? sample.pitch.toFixed(1) : "—"}° · roll{" "}
              {sample ? sample.roll.toFixed(1) : "—"}° · motion{" "}
              {latestRms.toFixed(2)}
            </p>
            <p>orient: {orientationSource} · motion: {motionSource}</p>
          </div>
          {!motionActive && !orientationActive && (
            <p className="text-amber-400 text-sm text-center max-w-xs">
              No sensor data yet — move your phone. If values stay at —, tap
              START again and allow motion access when prompted.
            </p>
          )}
        </>
      )}

      {engine.phase === "angleReveal" && activeChallenge && (
        <AngleReveal
          angle={activeChallenge.angleDegrees}
          axis={activeChallenge.axis}
        />
      )}

      {(engine.phase === "targeting" || engine.phase === "hold") &&
        activeChallenge && (
        <div className="flex flex-col items-center gap-6">
          <Dial
            currentAngle={engine.currentTilt}
            targetAngle={activeChallenge.angleDegrees}
            inTolerance={engine.inTolerance}
          />
          <p className="font-mono text-3xl text-white">
            {engine.currentTilt.toFixed(1)}°
          </p>
          {engine.phase === "targeting" && engine.lockProgress > 0 && (
            <p className="text-[#4FC3F7] text-sm">
              Locking... {Math.round(engine.lockProgress * 100)}%
            </p>
          )}
          {engine.phase === "hold" && (
            <HoldTimer
              remaining={engine.holdRemaining}
              inTolerance={engine.inTolerance}
            />
          )}
          {!portraitValid && (
            <p className="text-amber-400 text-sm">Hold phone upright</p>
          )}
          {!orientationActive && (
            <p className="text-amber-400 text-sm text-center max-w-xs">
              Tilt sensor not detected. Check browser sensor permissions.
            </p>
          )}
        </div>
      )}

      {engine.phase === "complete" && (
        <div className="flex flex-col items-center gap-6 w-full">
          <ScoreCard
            score={engine.score ?? 0}
            percentile={percentile}
            isPractice={isPractice}
            onShare={!isPractice ? handleShare : undefined}
            onPlayAgain={() => {
              if (isPractice) {
                rollPracticeChallenge();
                engine.reset();
              } else {
                router.push("/");
              }
            }}
          />
          {!isPractice && engine.score != null && dailyAngle && (
            <ShareCard
              score={engine.score}
              percentile={percentile}
              date={dailyAngle.date}
            />
          )}
        </div>
      )}

      {submitting && (
        <p className="text-zinc-500 text-sm">Submitting score...</p>
      )}
    </div>
  );
}
