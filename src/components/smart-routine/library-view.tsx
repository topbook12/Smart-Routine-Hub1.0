"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, ExternalLink, FlaskConical, GraduationCap, Library as LibraryIcon, Lock } from "lucide-react";
import { useRealtimeStats } from "@/hooks/use-realtime-data";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Degree = "bsc" | "msc" | "others" | null;

export function LibraryView() {
  const [degree, setDegree] = useState<Degree>(null);
  const [links, setLinks] = useState<Array<{
    id: string;
    degree: string;
    semester: number | null;
    url: string;
    title: string;
    isActive: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch library links once
  useMemo(() => {
    fetch("/api/library-links")
      .then((r) => r.json())
      .then((data) => setLinks(data))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
    return null;
  }, []);

  const filtered = useMemo(() => {
    if (!degree) return [];
    return links.filter((l) => l.degree === degree);
  }, [links, degree]);

  const degreeCards: { key: Exclude<Degree, null>; label: string; sub: string; Icon: typeof GraduationCap; gradient: string; glow: string }[] = [
    {
      key: "bsc",
      label: "B.Sc.",
      sub: "8 semesters · Bachelor's",
      Icon: GraduationCap,
      gradient: "from-teal-500 to-emerald-500",
      glow: "shadow-teal-glow",
    },
    {
      key: "msc",
      label: "M.Sc.",
      sub: "3 semesters · Master's",
      Icon: FlaskConical,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-glow",
    },
    {
      key: "others",
      label: "Others",
      sub: "Syllabus, forms & notices",
      Icon: BookMarked,
      gradient: "from-violet-500 to-purple-500",
      glow: "shadow-cyan-glow",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8 pb-28 lg:pb-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-3d card-inner-glow p-6 sm:p-10 mb-8 hero-bg"
      >
        <div className="relative z-10 max-w-2xl">
          <Badge variant="outline" className="mb-3">Resource Library</Badge>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            <span className="text-gradient-primary">Google</span> Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Access course materials, lecture notes, reference books and academic forms — organised by degree and semester.
          </p>
        </div>
      </motion.div>

      {/* Step 1: Degree selection */}
      {!degree && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="font-bold text-lg">Select your degree</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {degreeCards.map((c, i) => (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDegree(c.key)}
                className="card-3d card-inner-glow p-6 text-left relative overflow-hidden"
              >
                <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", c.gradient)} />
                <div className="relative z-10">
                  <div
                    className={cn(
                      "inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br items-center justify-center text-white mb-4",
                      c.gradient,
                      c.glow
                    )}
                  >
                    <c.Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-1">{c.label}</h3>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                  <p className="text-xs text-primary mt-3 font-medium">Browse resources →</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Semester selection */}
      {degree && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="font-bold text-lg">
                {degree === "others" ? "Other resources" : `Select semester — ${degree.toUpperCase()}`}
              </h2>
            </div>
            <button
              onClick={() => setDegree(null)}
              className="text-xs text-primary font-medium hover:underline"
            >
              ← Change degree
            </button>
          </div>

          {loading ? (
            <LoadingState message="Loading resources…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={LibraryIcon}
              title="No resources yet"
              message="Library links for this section haven't been added. Check back later."
            />
          ) : degree === "others" ? (
            <div className="card-3d card-inner-glow p-6">
              {filtered.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                    <BookMarked className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{l.title}</h3>
                    <p className="text-xs text-muted-foreground">Opens in Google Drive (new tab)</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((l, i) => {
                const available = l.isActive;
                const isBsc = l.degree === "bsc";
                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    className={cn(
                      "card-3d card-inner-glow p-5 relative overflow-hidden",
                      !available && "opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                        isBsc ? "from-teal-500 to-emerald-500" : "from-amber-500 to-orange-500"
                      )}
                    />
                    <div className="relative z-10 flex items-center justify-between mb-3">
                      <div
                        className={cn(
                          "inline-flex h-12 w-12 rounded-xl bg-gradient-to-br items-center justify-center text-white text-lg font-bold",
                          isBsc ? "from-teal-500 to-emerald-500 shadow-teal-glow" : "from-amber-500 to-orange-500 shadow-amber-glow"
                        )}
                      >
                        {l.semester ?? "★"}
                      </div>
                      {available ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Lock className="h-3 w-3" /> Soon
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">
                      {isBsc ? "B.Sc." : "M.Sc."} — Semester {l.semester}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">Course materials & lecture notes</p>
                    {available ? (
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white btn-3d bg-gradient-to-r",
                          isBsc ? "from-teal-600 to-emerald-600" : "from-amber-500 to-orange-500"
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open in Drive
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground bg-muted cursor-not-allowed"
                      >
                        <Lock className="h-3.5 w-3.5" /> Not available
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
