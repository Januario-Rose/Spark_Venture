
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Rocket,
    BookOpen,
    Search,
    Store,
    Wallet,
    ShieldCheck,
    BellRing,
    UsersRound,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
} from "lucide-react";

const slides = [
  {
    eyebrow: "YOUR BUSINESS JOURNEY STARTS HERE",
    title: "Turn your ideas into real opportunities.",
    description:
      "Find practical guidance, explore opportunities, and take the first steps towards building your business.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85",
    label: "Build your vision",
  },
  {
    eyebrow: "LEARN. PLAN. GROW.",
    title: "Build your business with confidence.",
    description:
      "Access helpful learning resources and practical insights to help you make informed business decisions.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=85",
    label: "Grow your knowledge",
  },
  {
    eyebrow: "YOUR NEXT CHAPTER",
    title: "Discover what's possible for your business.",
    description:
      "Explore new possibilities, strengthen your ideas, and prepare for the next stage of your entrepreneurial journey.",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=85",
    label: "Explore opportunities",
  },
];


const features = [
  {
    number: "01",
    icon: Rocket,
    title: "Business Registration",
    description:
      "Guidance to formalise your business and find CIPC resources.",
    tags: ["Business formalisation", "CIPC resources"],
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Bookkeeping & Finance",
    description:
      "Track income, expenses and invoices in one place.",
    tags: ["Income and expenses", "Financial tracking"],
  },
  {
    number: "03",
    icon: Search,
    title: "Procurement Access",
    description:
      "Discover tenders, RFQs and supplier opportunities.",
    tags: ["Tender opportunities", "Supplier access"],
  },
  {
    number: "04",
    icon: Store,
    title: "Market Links",
    description:
      "Find customers, markets and new sales channels.",
    tags: ["Find customers", "Sales channels"],
  },
  {
    number: "05",
    icon: Wallet,
    title: "Funding Readiness",
    description:
      "Prepare your business to explore funding opportunities.",
    tags: ["Funding opportunities", "Business preparation"],
  },
  {
    number: "06",
    icon: ShieldCheck,
    title: "Fraud Protection",
    description:
      "Learn to recognise scams and protect business data.",
    tags: ["Scam awareness", "Data protection"],
  },
  {
    number: "07",
    icon: BellRing,
    title: "Reminders & Compliance",
    description:
      "Keep track of deadlines and business obligations.",
    tags: ["Important deadlines", "Business compliance"],
  },
  {
    number: "08",
    icon: UsersRound,
    title: "Support & Resources",
    description:
      "Explore learning materials and business support.",
    tags: ["Learning materials", "Business support"],
  },
];


export default function Features() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  const previousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  };

  const nextSlide = () => {
    setActiveSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
  const timer = setInterval(() => {
    setActiveSlide((current) => (current + 1) % slides.length);
  }, 8000);

  return () => clearInterval(timer);
}, []);59
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero carousel */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="relative isolate min-h-[520px] overflow-hidden rounded-[2rem] bg-slate-950 sm:min-h-[570px]">
          {slides.map((item, index) => (
            <div
                key={item.title}
                className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                index === activeSlide
                    ? "z-0 opacity-100"
                    : "z-[-1] opacity-0"
                }`}
                aria-hidden={index !== activeSlide}
            >
                <img
                src={item.image}
                alt={item.label}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                    index === activeSlide ? "scale-105" : "scale-100"
                }`}
                />
            </div>
))}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />

          <div className="relative z-10 flex min-h-[520px] flex-col justify-center px-6 py-16 sm:min-h-[570px] sm:px-12 lg:max-w-3xl lg:px-16">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-blue-200 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {slide.eyebrow}
            </span>

            <h1
            key={slide.title}
            className="animate-[fadeIn_1000ms_ease-in-out] max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
            {slide.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              {slide.description}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500"
              >
                Get started
                <ArrowRight size={18} />
              </Link>

              <a
                href="#our-features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Explore features
              </a>
            </div>
          </div>

          {/* Carousel controls */}
          <div className="absolute bottom-7 right-6 z-20 flex items-center gap-3 sm:bottom-10 sm:right-10">
            <div className="mr-2 hidden text-sm font-medium text-white/80 sm:block">
              {String(activeSlide + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </div>

            <button
              type="button"
              onClick={previousSlide}
              aria-label="Previous slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 transition hover:bg-blue-100"
            >
              <ArrowRight size={19} />
            </button>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-10 left-6 z-20 flex gap-2 sm:left-16">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeSlide
                    ? "w-9 bg-cyan-400"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section
        id="our-features"
        className="scroll-mt-24 px-6 py-16 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              What we offer
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything starts with{" "}
              <span className="text-blue-600">a step forward.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Whether you are exploring your first business idea or looking
              for ways to improve an existing venture, SparkVenture is designed
              to help you learn, plan, and move forward.
            </p>
          </div>

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.number}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={23} />
                    </div>

                    <span className="text-sm font-semibold text-slate-300">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {feature.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                Your journey
              </span>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                From an idea to your next big move.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-600">
                Building a business is a journey. Start by understanding your
                idea, learn what you need, and turn your goals into practical
                next steps.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    title: "Discover",
                    text: "Identify your interests, ideas, and potential opportunities.",
                  },
                  {
                    title: "Learn",
                    text: "Build your knowledge with practical business resources.",
                  },
                  {
                    title: "Take action",
                    text: "Set goals and decide on your next steps.",
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85"
                alt="Entrepreneur planning business goals at a desk"
                loading="lazy"
                className="h-[360px] w-full rounded-3xl object-cover shadow-lg sm:h-[460px]"
              />

              <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:left-8 sm:right-8 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Progress starts with a plan
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Learn, explore, and take your next step with purpose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to bring your business idea to life?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-50">
            Start exploring the resources and opportunities that can help you
            move forward on your entrepreneurial journey.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Get started today
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
