import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-1 overflow-hidden px-6 py-8 sm:px-10 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-24 size-80 rounded-full bg-secondary blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-20 size-96 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <p className="text-lg font-black tracking-[-0.05em]">
            UNI<span className="text-accent">-</span>TALENT
          </p>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link
              className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href="/auth/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href="/auth/sign-up"
            >
              Join with SDSU
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-2 rounded-full bg-accent" />
              Built at San Diego State University
            </p>
            <h1 className="text-balance text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Find the talent already on{" "}
              <em className="font-heading font-normal text-accent">
                your campus.
              </em>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              UNI-TALENT will help verified SDSU students discover services,
              explore portfolios, and connect directly with student creators.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                href="/auth/sign-up"
              >
                Create an account
              </Link>
              <Link
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition hover:border-foreground/25 hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                href="/auth/login"
              >
                Student sign in
              </Link>
            </div>
          </div>

          <aside className="relative mx-auto w-full max-w-md rotate-2 rounded-[2rem] border border-border bg-card p-7 shadow-[0_24px_80px_rgba(37,40,32,0.10)] transition-transform duration-300 hover:rotate-0">
            <div className="mb-12 flex items-start justify-between">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
                Foundation ready
              </span>
              <span aria-hidden="true" className="text-3xl text-accent">
                ✳
              </span>
            </div>
            <p className="font-heading text-3xl leading-tight">
              Small campus.
              <br />
              Big talent.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-2 text-center text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="rounded-xl bg-muted px-2 py-3">Discover</span>
              <span className="rounded-xl bg-muted px-2 py-3">Create</span>
              <span className="rounded-xl bg-muted px-2 py-3">Connect</span>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
