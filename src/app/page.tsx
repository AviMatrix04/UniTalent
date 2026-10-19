import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  GraduationCap,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const services = [
  {
    title: "Graduation photography",
    description: "Portrait sessions around campus with edited photos included.",
    price: "$45/hour",
    image: "/landing/graduation-photography.png",
    tag: "Photography",
    icon: Camera,
  },
  {
    title: "Calculus tutoring",
    description: "Patient one-on-one help with concepts, practice, and exams.",
    price: "$25/hour",
    image: "/landing/math-tutoring.png",
    tag: "Tutoring",
    icon: GraduationCap,
  },
  {
    title: "Poster & visual design",
    description: "Distinctive graphics for student organizations and events.",
    price: "$40/service",
    image: "/landing/graphic-design.png",
    tag: "Design",
    icon: Palette,
  },
];

const sampleReviews = [
  {
    quote:
      "Finding someone on campus feels much easier than searching through random listings online.",
    name: "Maya",
  },
  {
    quote:
      "I can see the work, the price, and how to reach the student—all before sending a message.",
    name: "Jordan",
  },
  {
    quote:
      "It gives student creators a place that feels professional without losing the campus connection.",
    name: "Elena",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-background">
      <header className="relative z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link className="text-lg font-black tracking-[-0.06em]" href="/">
            UNI<span className="text-accent">-</span>TALENT
          </Link>
          <nav
            aria-label="Account"
            className="flex items-center gap-1 sm:gap-2"
          >
            <a
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-muted sm:inline-flex"
              href="#services"
            >
              See examples
            </a>
            <Link
              className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-muted sm:px-4"
              href="/auth/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90"
              href="/auth/sign-up"
            >
              Join with SDSU
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="absolute -left-32 top-20 size-96 rounded-full bg-secondary/70 blur-3xl" />
        <div className="absolute -right-32 top-0 size-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="landing-reveal max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm">
              <BadgeCheck className="size-4 text-accent" />
              Verified SDSU students only
            </p>
            <h1 className="mt-7 text-balance font-heading text-6xl leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
              Find the talent already on{" "}
              <em className="font-normal text-accent">your campus.</em>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Discover student-run services, explore real portfolios, and
              connect directly with talented people at San Diego State.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-1 hover:bg-accent/90"
                href="/auth/sign-up"
              >
                Explore with your SDSU email
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-foreground/25"
                href="/auth/login"
              >
                Student sign in
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6 text-sm">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" />
                Campus-only directory
              </p>
              <p className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                Built for student creators
              </p>
            </div>
          </div>

          <div className="landing-float relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2.5rem] border-8 border-card bg-muted shadow-[0_30px_100px_rgba(37,40,32,0.18)] sm:aspect-[6/4]">
              <Image
                alt="Students collaborating together on a sunny university campus"
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                src="/landing/campus-collaboration.png"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                    One campus. Hundreds of skills.
                  </p>
                  <p className="mt-2 font-heading text-2xl sm:text-3xl">
                    Create. Teach. Help. Connect.
                  </p>
                </div>
                <span className="hidden size-12 items-center justify-center rounded-full bg-card text-foreground sm:flex">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </div>
            <div className="absolute -left-4 top-8 rounded-2xl border border-border bg-card p-4 shadow-xl sm:-left-10">
              <p className="text-xs font-bold text-muted-foreground">
                Popular now
              </p>
              <div className="mt-2 flex gap-2 text-xs font-semibold">
                <span className="rounded-full bg-secondary px-2.5 py-1">
                  Tutoring
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  Design
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-foreground px-5 py-7 text-background sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center text-sm sm:justify-between">
          <p className="font-heading text-2xl">Made for the SDSU community</p>
          <p className="text-background/70">Verified university email</p>
          <p className="text-background/70">Direct student contact</p>
          <p className="text-background/70">Portfolio-first discovery</p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28" id="services">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Example services
              </p>
              <h2 className="mt-4 max-w-2xl font-heading text-5xl leading-none tracking-[-0.045em] sm:text-6xl">
                Campus talent, made discoverable.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              Browse by skill, compare clear pricing, view portfolio work, and
              contact the student directly.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="group overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      alt={service.title}
                      className="object-cover transition duration-700 group-hover:scale-105"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      src={service.image}
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-2 text-xs font-bold backdrop-blur">
                      <Icon className="size-3.5 text-accent" />
                      {service.tag}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-heading text-3xl leading-none">
                        {service.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">
                        {service.price}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Sample listing
                      </span>
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-bold"
                        href="/auth/sign-up"
                      >
                        Join to explore <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary/60 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              How it works
            </p>
            <h2 className="mt-4 font-heading text-5xl leading-none tracking-[-0.045em] sm:text-6xl">
              From skill to connection in three steps.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
              No booking system or platform fees. UNI-TALENT helps students find
              each other, then lets them decide how to work together.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                number: "01",
                title: "Verify your SDSU account",
                text: "Use your university email so the directory stays inside the campus community.",
                icon: ShieldCheck,
              },
              {
                number: "02",
                title: "Explore skills and portfolios",
                text: "Search by service, filter by skill or price, and see examples before reaching out.",
                icon: Search,
              },
              {
                number: "03",
                title: "Connect directly",
                text: "Use the provider’s visible contact method and arrange the details together.",
                icon: ArrowUpRight,
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8"
                >
                  <span className="font-heading text-4xl text-accent">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-5" />
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Student feedback
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-heading text-5xl leading-none tracking-[-0.045em] sm:text-6xl">
              Built around how students actually connect.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {sampleReviews.map((review) => (
              <figure
                key={review.name}
                className="rounded-3xl border border-border bg-card p-7 shadow-sm"
              >
                <div
                  aria-label="5 out of 5 stars"
                  className="flex gap-1 text-accent"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star className="size-4 fill-current" key={index} />
                  ))}
                </div>
                <blockquote className="mt-6 font-heading text-2xl leading-snug">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-7 border-t border-border pt-5">
                  <p className="font-bold">{review.name}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-14 text-center text-background sm:px-12 sm:py-20">
          <div className="absolute -left-20 -top-28 size-72 rounded-full border border-background/10" />
          <div className="absolute -bottom-40 right-10 size-80 rounded-full bg-accent" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-background/65">
              Your campus already has the talent
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl font-heading text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
              Come find your people.
            </h2>
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-accent/90"
              href="/auth/sign-up"
            >
              Join UNI-TALENT <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p className="font-black tracking-[-0.05em] text-foreground">
            UNI<span className="text-accent">-</span>TALENT
          </p>
          <p>A student-built directory for San Diego State University.</p>
          <div className="flex gap-4">
            <Link className="hover:text-foreground" href="/auth/login">
              Sign in
            </Link>
            <Link className="hover:text-foreground" href="/auth/sign-up">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
