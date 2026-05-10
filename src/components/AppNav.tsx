import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, MessageCircle, Sparkles, LogOut } from "lucide-react";

export function AppNav() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const linkCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-primary text-primary-foreground shadow-soft"
        : "text-foreground/70 hover:text-foreground hover:bg-secondary"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Naija<span className="text-primary">Tutor</span>
          </span>
        </Link>

        {user ? (
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/dashboard" className={linkCls(path === "/dashboard")}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/quiz" className={linkCls(path.startsWith("/quiz"))}>
              <Sparkles className="h-4 w-4" /> Quiz
            </Link>
            <Link to="/library" className={linkCls(path.startsWith("/library"))}>
              <GraduationCap className="h-4 w-4" /> Library
            </Link>
            <Link to="/tutor" className={linkCls(path === "/tutor")}>
              <MessageCircle className="h-4 w-4" /> AI Tutor
            </Link>
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                nav({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}