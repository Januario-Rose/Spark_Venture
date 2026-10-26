
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Lightbulb,
  Target,
  Users,
  Compass,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We encourage creative thinking and help entrepreneurs explore new ideas and possibilities.",
  },
  {
    icon: Target,
    title: "Purposeful growth",
    description:
      "We believe business growth starts with clear goals, practical planning, and consistent action.",
  },
  {
    icon: Users,
    title: "Accessibility",
    description:
      "We aim to make useful entrepreneurial guidance and resources easier to discover and understand.",
  },
  {
    icon: HeartHandshake,
    title: "Empowerment",
    description:
      "We want entrepreneurs to feel more confident in making decisions and taking their next steps.",
  },
];

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Explore your interests, identify problems worth solving, and recognise potential business opportunities.",
  },
  {
    number: "02",
    title: "Develop",
    description:
      "Strengthen your idea, learn about your customers, and build a clearer picture of your business.",
  },
  {
    number: "03",
    title: "Grow",
    description:
      "Set meaningful goals, take practical action, and continue learning as your business develops.",
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 px-6 py-20 sm:py-28 lg:px-8">
        <div className="absolute -right-20 -top-24 -z-10 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 -z-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              About SparkVenture
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Every great venture starts with{" "}
              <span className="text-blue-400">an idea.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              SparkVenture aims to help aspiring and established entrepreneurs
              turn ideas into opportunities through practical guidance,
              accessible resources, and purposeful business development.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/features"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Explore our features
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View pricing
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
              alt="A team collaborating and sharing ideas"
              className="h-[340px] w-full rounded-3xl object-cover shadow-2xl sm:h-[430px]"
            />

            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:left-8 sm:right-8 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp size={24} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Your ideas deserve a starting point.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Learn, plan, discover, and take your next step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="px-6 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Who we are
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Making the entrepreneurial journey easier to navigate.
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p>
              Starting or growing a business involves more than having a good
              idea. Entrepreneurs also need knowledge, direction, planning,
              and an understanding of the people they want to serve.
            </p>

            <p>
              SparkVenture is designed to bring useful entrepreneurial
              guidance and resources together in one accessible place. Our
              goal is to help people explore opportunities, develop their
              thinking, and approach business challenges with greater clarity.
            </p>

            <p>
              Whether you are considering your first business idea or looking
              for ways to develop an existing venture, SparkVenture aims to
              support you as you learn and move forward.
            </p>
          </div>
        </div>
      </section>

      {/* Mission and vision */}
      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target size={27} />
            </div>

            <h2 className="mt-6 text-2xl font-bold">Our mission</h2>

            <p className="mt-4 leading-8 text-slate-600">
              To make entrepreneurial guidance, learning resources, and
              opportunity discovery more accessible, helping entrepreneurs
              make informed decisions and take practical steps towards
              building sustainable businesses.
            </p>
          </article>

          <article className="rounded-3xl bg-gradient-to-br from-blue-700 to-cyan-600 p-8 text-white sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Compass size={27} />
            </div>

            <h2 className="mt-6 text-2xl font-bold">Our vision</h2>

            <p className="mt-4 leading-8 text-blue-50">
              To become a trusted starting point for entrepreneurs seeking
              the knowledge, direction, and opportunities to turn their
              business ambitions into meaningful progress.
            </p>
          </article>
        </div>
      </section>

      {/* Core values */}
      <section className="px-6 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              What guides us
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              The values behind SparkVenture
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              These principles shape how we want to support entrepreneurs
              throughout their business journeys.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">{value.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How we help */}
      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              How it works
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              A clearer path from idea to action.
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              Entrepreneurship is a process. SparkVenture aims to help you
              approach it one step at a time.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="relative rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
                <span className="text-sm font-bold tracking-widest text-blue-600">
                  STEP {step.number}
                </span>

                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CheckCircle2 size={17} className="text-blue-600" />
                  Take the next step
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 px-6 py-14 text-center sm:px-12 sm:py-16">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Your journey starts here
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Have an idea? Let's take it further.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
            Discover what SparkVenture offers and take the next step towards
            developing your business idea.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Get started
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
