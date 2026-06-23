"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HomeView } from "@/components/smart-routine/home-view";
import { MasterCalendarView } from "@/components/smart-routine/master-calendar-view";
import { StudentView } from "@/components/smart-routine/student-view";
import { LibraryView } from "@/components/smart-routine/library-view";
import { LoadingState } from "@/components/shared/states";

function ViewRouter() {
  const view = useSearchParams().get("view");

  if (!view || view === "home") return <HomeView />;
  if (view === "master-calendar") return <MasterCalendarView />;
  if (view === "student") return <StudentView />;
  if (view === "library") return <LibraryView />;
  return <HomeView />;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState message="Loading view…" className="min-h-[50vh]" />}>
      <ViewRouter />
    </Suspense>
  );
}
