import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-border/30">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <span className="font-vortex text-2xl tracking-tight text-foreground">Vortex HR</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/dashboard">Login</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/dashboard">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Decorative clouds/shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute top-40 right-[15%] w-48 h-48 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute bottom-20 left-[30%] w-80 h-80 rounded-full bg-white/20 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-6 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-display font-black tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
            Hire smarter with
            <span className="block mt-2">AI-powered insights</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70 md:text-xl font-sans">
            Create custom application forms, collect candidates, and let AI rank them for you.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="min-w-[180px] rounded-full text-base px-8 shadow-soft" asChild>
              <Link to="/dashboard">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <span className="font-vortex text-lg tracking-tight text-foreground/80">Vortex HR</span>
            <span className="text-sm text-foreground/60 font-sans">
              © 2025 Vortex HR. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
