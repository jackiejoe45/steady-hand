"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AngleReveal } from "@/components/game/AngleReveal";
import { Dial } from "@/components/game/Dial";
import { HoldTimer } from "@/components/game/HoldTimer";
import { ScoreCard } from "@/components/game/ScoreCard";
import { ShareCard } from "@/components/game/ShareCard";
import { ShakeGate } from "@/components/game/ShakeGate";
import { TiltMotionGuide } from "@/components/game/TiltMotionGuide";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { useSession } from "@/lib/auth-client";

interface DailyAngle {
  date: string;
  angleDegrees: number;
  axis: Axis;
}

export function GameScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("mode") === "practice";
  const { data: session } = useSession();

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
    startSensors,
  } = useSensors();
  const { playCue, startShakeLoop } = useAudioCues();

  const handleComplete = useCallback(
    async (
      score: number,
      samples: { timestamp: number; pitch: number; roll: number }[],
    ) => {
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
      <div className="flex h-full items-center justify-center">
        <p className="section-label animate-pulse-glow">Loading</p>
      </div>
    );
  }

  const showHeader = engine.phase === "idle" || engine.phase === "complete";
  const headerIndex = isPractice ? "Practice" : "01 / Daily";
  const headerTitle = isPractice ? "Practice Run" : "SteadyHand";
  const headerSubtitle = isPractice
    ? "Random angle — no leaderboard"
    : "One angle. One shot. Steady wins.";

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {showHeader && (
        <div className="shrink-0 pb-3">
          <PageHeader
            index={headerIndex}
            title={headerTitle}
            subtitle={headerSubtitle}
            compact
          />
          {!isPractice && dailyAngle && engine.phase === "idle" && (
            <div className="mt-3 flex justify-center gap-3">
              <div className="card rounded-sm px-3 py-2 text-center">
                <p className="section-label">Date</p>
                <p className="font-mono text-xs text-[var(--fg-muted)] mt-0.5">
                  {dailyAngle.date}
                </p>
              </div>
              <div className="card rounded-sm px-3 py-2 text-center">
                <p className="section-label">Axis</p>
                <p className="font-mono text-xs text-[var(--accent-teal)] mt-0.5 capitalize">
                  {dailyAngle.axis}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {engine.phase === "idle" && (
          <div className="flex flex-col items-center gap-4 text-center animate-fade-up">
            {!isPractice && dailyAngle && (
              <TiltMotionGuide mode="intro" axis={dailyAngle.axis} compact />
            )}
            {isPractice && (
              <p className="section-label">Random challenge</p>
            )}
            <span className="font-serif text-6xl text-[var(--fg-subtle)]">
              ??°
            </span>
            <button onClick={handleStart} className="btn-primary px-10 py-3.5">
              Start
            </button>
          </div>
        )}

        {engine.phase === "shakeGate" && (
          <div className="flex flex-col items-center gap-4 animate-fade-up">
            <p className="section-label">02 / Unlock</p>
            <ShakeGate progress={engine.shakeProgress} />
            {!motionActive && !orientationActive && (
              <p className="text-[var(--accent-teal)] text-xs text-center max-w-[16rem] leading-relaxed">
                No sensor data yet — move your phone. Tap Start again if
                prompted for motion access.
              </p>
            )}
          </div>
        )}

        {engine.phase === "angleReveal" && activeChallenge && (
          <AngleReveal
            angle={activeChallenge.angleDegrees}
            axis={activeChallenge.axis}
          />
        )}

        {(engine.phase === "targeting" || engine.phase === "hold") &&
          activeChallenge && (
            <div className="flex w-full max-w-xs flex-col items-center gap-2">
              {engine.phase === "targeting" && (
                <TiltMotionGuide
                  mode="targeting"
                  axis={activeChallenge.axis}
                  targetAngle={activeChallenge.angleDegrees}
                  currentAngle={engine.currentTilt}
                  compact
                />
              )}
              <Dial
                currentAngle={engine.currentTilt}
                targetAngle={activeChallenge.angleDegrees}
                inTolerance={engine.inTolerance}
                size={200}
              />
              <p className="font-mono text-2xl text-[var(--fg)]">
                {engine.currentTilt.toFixed(1)}°
              </p>
              {engine.phase === "targeting" && engine.lockProgress > 0 && (
                <p className="section-label text-[var(--accent-teal)]">
                  Locking {Math.round(engine.lockProgress * 100)}%
                </p>
              )}
              {engine.phase === "hold" && (
                <HoldTimer
                  remaining={engine.holdRemaining}
                  inTolerance={engine.inTolerance}
                />
              )}
              {!portraitValid && (
                <p className="text-[var(--accent-teal)] text-xs">
                  Hold phone upright
                </p>
              )}
            </div>
          )}

        {engine.phase === "complete" && (
          <div className="flex w-full max-w-xs flex-col items-center gap-4 animate-fade-up">
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
                compact
              />
            )}
          </div>
        )}

        {submitting && (
          <p className="section-label mt-2">Submitting score</p>
        )}
      </div>

      {engine.phase === "idle" && (
        <footer className="shrink-0 space-y-3 pb-2 text-center">
          <div className="editorial-rule" />
          {isPractice ? (
            <Link
              href="/"
              className="text-xs tracking-wide text-[var(--fg-muted)] hover:text-[var(--accent-teal)]"
            >
              Back to daily challenge
            </Link>
          ) : (
            <Link
              href="/?mode=practice"
              className="text-xs tracking-wide text-[var(--fg-muted)] hover:text-[var(--accent-teal)]"
            >
              Practice before your daily attempt
            </Link>
          )}
          {!session && (
            <Link
              href="/sign-in"
              className="block text-xs text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
            >
              Sign in to save your score
            </Link>
          )}
        </footer>
      )}
    </div>
  );
}
