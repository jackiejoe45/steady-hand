import Link from "next/link";
import { Suspense } from "react";
import { AuthButtonsWrapper } from "@/components/AuthButtonsWrapper";
import { GameScreen } from "@/components/game/GameScreen";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";

async function HomeStats() {
  const date = getUtcTodayDateStr();
  const { axis } = computeDailyAngle(date);

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center">
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-zinc-500 text-xs uppercase">Today</p>
        <p className="font-mono text-lg mt-1">{date}</p>
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-zinc-500 text-xs uppercase">Axis</p>
        <p className="font-mono text-lg mt-1 capitalize">{axis}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <header className="w-full max-w-lg px-4 pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Steady<span className="text-[#4FC3F7]">Hand</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          One angle. One shot. Steady wins.
        </p>
      </header>

      <Suspense fallback={null}>
        <HomeStats />
      </Suspense>

      <div className="w-full mt-6">
        <Suspense fallback={<div className="text-center text-zinc-500">Loading game...</div>}>
          <GameScreen />
        </Suspense>
      </div>

      <div className="flex flex-col items-center gap-4 mt-8 px-4 w-full">
        <Link
          href="/?mode=practice"
          className="text-[#4FC3F7] text-sm underline"
        >
          Practice before your daily attempt
        </Link>
        <AuthButtonsWrapper />
      </div>
    </div>
  );
}
