import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative grid min-h-svh overflow-hidden bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-20 size-72 rounded-full border border-white/15"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 size-96 rounded-full bg-accent/90 blur-[2px]"
        />
        <Link
          href="/"
          className="relative z-10 w-fit text-xl font-black tracking-[-0.06em] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          UNI<span className="text-accent">-</span>TALENT
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-white/65">
            SDSU students only
          </p>
          <p className="font-heading text-5xl leading-[0.98] tracking-[-0.04em]">
            Your campus is full of people worth knowing.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-primary">
            {["Photography", "Tutoring", "Design", "Music"].map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-background px-3 py-2"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/70">
          Discover, create, and connect at San Diego State.
        </p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute right-[-5rem] top-[-5rem] size-64 rounded-full bg-secondary blur-3xl"
        />
        <div className="relative w-full max-w-md animate-[auth-enter_450ms_ease-out_both]">
          <Link
            href="/"
            className="mb-12 inline-block text-lg font-black tracking-[-0.06em] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:hidden"
          >
            UNI<span className="text-accent">-</span>TALENT
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-7 border-t border-border pt-6 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
