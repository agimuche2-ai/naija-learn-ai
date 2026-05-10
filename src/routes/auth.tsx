import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const pwSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  const signIn = async () => {
    const e = emailSchema.safeParse(email);
    const p = pwSchema.safeParse(password);
    if (!e.success) return toast.error(e.error.issues[0].message);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e.data, password: p.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  const signUp = async () => {
    const e = emailSchema.safeParse(email);
    const p = pwSchema.safeParse(password);
    if (!e.success) return toast.error(e.error.issues[0].message);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: e.data,
      password: p.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim() || null },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to verify your account.");
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left visual */}
        <div className="relative hidden overflow-hidden bg-gradient-hero p-12 lg:block">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-background/20 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-primary-foreground">NaijaTutor</span>
          </Link>
          <div className="mt-24 max-w-md">
            <h2 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground">
              Your AI Chemistry coach is ready.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Sign in to continue your learning streak, see your weak topics, and chat with the AI tutor.
            </p>
          </div>
          <div className="absolute bottom-8 left-12 right-12 rounded-2xl bg-background/15 p-5 text-primary-foreground backdrop-blur">
            <p className="text-sm italic">
              "I went from a C5 to a B2 in two months using NaijaTutor every evening."
            </p>
            <p className="mt-2 text-xs opacity-80">— Chiamaka, SSS3 student, Lagos</p>
          </div>
        </div>

        {/* Right form */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">NaijaTutor</span>
            </Link>

            <h1 className="mt-8 font-display text-3xl font-bold">Welcome 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice Chemistry the smart way.
            </p>

            <Button
              onClick={google}
              disabled={busy}
              variant="outline"
              className="mt-6 w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4a6 6 0 1 1 0-12c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.4 14.7 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.2-.2-1.9H12z"/></svg>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.ng" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button onClick={signIn} disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adaeze Okafor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Password</Label>
                  <Input id="pw2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button onClick={signUp} disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}