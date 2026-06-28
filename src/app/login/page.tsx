"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Eraser,
  Delete,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/settings-store";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "email" | "pin" | "student";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const settings = useSettingsStore((s) => s.settings);
  const [mode, setMode] = useState<Mode>("email");

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "admin") router.replace("/admin");
      else if (role === "student") router.replace("/student-dashboard");
      else router.replace("/teacher");
    }
  }, [status, session, router]);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 overflow-hidden hero-bg">
      {/* Animated blobs */}
      <div className="absolute top-10 left-10 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl animate-blob" style={{ animationDelay: "5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-blob" style={{ animationDelay: "10s" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Top-right theme toggle */}
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>

        {/* Back to home */}
        <button
          onClick={() => router.push("/?view=home")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </button>

        {/* Logo & title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 items-center justify-center shadow-teal-glow mb-3 relative">
            <Sparkles className="h-8 w-8 text-white" />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/30"
            />
          </div>
          <h1 className="text-2xl font-bold text-gradient-primary">{settings.siteName}</h1>
          <p className="text-xs text-muted-foreground mt-1">{settings.departmentName}</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-premium rounded-2xl p-6 sm:p-7 shadow-2xl"
        >
          {/* Mode toggle */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/60 mb-6">
            {(["email", "pin", "student"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "relative py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                  mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === m && (
                  <motion.span
                    layoutId="login-mode"
                    className="absolute inset-0 rounded-lg bg-ink shadow-teal-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {m === "email" ? <Mail className="h-3.5 w-3.5" /> : m === "pin" ? <KeyRound className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{m === "email" ? "Email" : m === "pin" ? "PIN" : "Student"}</span>
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "email" ? (
              <EmailForm key="email" />
            ) : mode === "pin" ? (
              <PinForm key="pin" />
            ) : (
              <StudentForm key="student" />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 rounded-xl bg-card/60 border border-border text-[11px] text-muted-foreground"
        >
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Demo credentials
          </p>
          <p>Admin → <code className="text-primary">admin@ice.ru.ac.bd</code> / <code className="text-primary">admin123</code></p>
          <p>Teacher → <code className="text-primary">mrh@ice.ru.ac.bd</code> / <code className="text-primary">teacher123</code></p>
          <p>Student → roll <code className="text-primary">30001</code> / <code className="text-primary">student123</code> (BSc Sem 1)</p>
          <p>Student → roll <code className="text-primary">28001</code> / <code className="text-primary">student123</code> (BSc Sem 3)</p>
          <p className="mt-1">PIN → any teacher&apos;s 6-digit PIN (e.g. <code className="text-primary">000000</code> for admin)</p>
        </motion.div>
      </div>
    </div>
  );
}

function EmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }
    toast.success("Logged in successfully");

    // signIn succeeded (no error). NextAuth has set the session cookie.
    // Instead of immediately fetching /api/user (which may race with the
    // cookie not being sent yet), wait a moment for the session to settle,
    // then use useSession() on the target dashboard page to read the role.
    // We do a simple role fetch with retries as a best-effort redirect.
    let role: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const r2 = await fetch("/api/user", { cache: "no-store" }).then((x) => x.json());
        role = r2?.user?.role;
        if (role) break;
      } catch {
        // ignore and retry
      }
    }

    // Even if role fetch failed, signIn succeeded so the session IS valid.
    // The dashboard pages read role from useSession() directly, so just
    // route to the most likely dashboard. Admin email is known, otherwise
    // default to teacher.
    if (role === "admin") router.replace("/admin");
    else if (role === "teacher") router.replace("/teacher");
    else if (role === "student") router.replace("/student-dashboard");
    else {
      // Fallback: role unknown but session exists. Check session via
      // the NextAuth session endpoint.
      try {
        const sess = await fetch("/api/auth/session", { cache: "no-store" }).then((x) => x.json());
        const sessRole = sess?.user?.role;
        if (sessRole === "admin") router.replace("/admin");
        else if (sessRole === "teacher") router.replace("/teacher");
        else if (sessRole === "student") router.replace("/student-dashboard");
        else router.replace("/");
      } catch {
        router.replace("/");
      }
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="email" className="text-xs">Email address</Label>
        <div className="relative mt-1.5">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ice.ru.ac.bd"
            className="pl-9 h-11"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-xs">Password</Label>
        <div className="relative mt-1.5">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9 pr-10 h-11"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-1.5"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </motion.form>
  );
}

function PinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const submit = async (value: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    setError(null);
    const res = await signIn("pin", { pin: value, redirect: false });
    if (res?.error) {
      setLoading(false);
      setError("Invalid PIN. Please try again.");
      setPin("");
      submittedRef.current = false;
      return;
    }
    toast.success("PIN verified");
    // Retry role fetch — session cookie needs a moment to settle.
    let role: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const r2 = await fetch("/api/user", { cache: "no-store" }).then((x) => x.json());
        role = r2?.user?.role;
        if (role) break;
      } catch {
        // ignore and retry
      }
    }
    if (role === "admin") router.replace("/admin");
    else if (role === "teacher") router.replace("/teacher");
    else if (role === "student") router.replace("/student-dashboard");
    else {
      // Fallback: check session endpoint
      try {
        const sess = await fetch("/api/auth/session", { cache: "no-store" }).then((x) => x.json());
        const sessRole = sess?.user?.role;
        if (sessRole === "admin") router.replace("/admin");
        else if (sessRole === "teacher") router.replace("/teacher");
        else if (sessRole === "student") router.replace("/student-dashboard");
        else router.replace("/");
      } catch {
        router.replace("/");
      }
    }
  };

  const press = (digit: string) => {
    if (pin.length >= 6 || loading) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 6) {
      submit(next);
    }
  };

  const backspace = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-5"
    >
      <p className="text-xs text-muted-foreground text-center">
        Enter your 6-digit PIN to sign in instantly
      </p>

      {/* PIN dots */}
      <div className="flex items-center justify-center gap-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = i < pin.length;
          return (
            <motion.div
              key={i}
              animate={{ scale: filled ? 1.1 : 1 }}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 transition-colors",
                filled
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 border-transparent shadow-amber-glow"
                  : "border-border bg-muted/40"
              )}
            />
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((k) => {
          if (k === "clear") {
            return (
              <button
                key="clear"
                onClick={() => {
                  setPin("");
                  setError(null);
                }}
                disabled={loading || !pin}
                className="h-14 rounded-xl bg-muted/60 border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
              >
                <Delete className="h-4 w-4" />
              </button>
            );
          }
          if (k === "back") {
            return (
              <button
                key="back"
                onClick={backspace}
                disabled={loading || !pin}
                className="h-14 rounded-xl bg-muted/60 border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                <Eraser className="h-4 w-4" />
              </button>
            );
          }
          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.92 }}
              onClick={() => press(k)}
              disabled={loading || pin.length >= 6}
              className="h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xl font-bold btn-3d shadow-amber-glow disabled:opacity-40"
            >
              {loading && pin.length === 6 ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : k}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function StudentForm() {
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("student", {
      rollNumber,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError("Invalid roll number or password. Please try again.");
      return;
    }
    toast.success("Logged in as student");
    // Small delay so NextAuth persists the session cookie before navigating
    // to the dashboard, which immediately checks authentication.
    await new Promise((r) => setTimeout(r, 600));
    router.replace("/student-dashboard");
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="roll" className="text-xs">Roll Number</Label>
        <div className="relative mt-1.5">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="roll"
            type="text"
            required
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. 30001"
            className="pl-9 h-11"
            autoComplete="username"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="spass" className="text-xs">Password</Label>
        <div className="relative mt-1.5">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="spass"
            type={showPass ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9 pr-10 h-11"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 btn-3d btn-gold gap-1.5"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
        {loading ? "Signing in…" : "Student Sign In"}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">
        Students see only their own semester schedule and notices.
      </p>
    </motion.form>
  );
}
