
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Start exploring your entrepreneurial potential.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    buttonText: "Get started free",
    featured: false,
    features: [
      { text: "Access introductory resources", included: true },
      { text: "Explore business opportunities", included: true },
      { text: "Basic business planning guidance", included: true },
      { text: "Advanced planning tools", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For entrepreneurs ready to turn ideas into action.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    icon: Zap,
    buttonText: "Choose Pro",
    featured: true,
    features: [
      { text: "Access introductory resources", included: true },
      { text: "Explore business opportunities", included: true },
      { text: "Basic business planning guidance", included: true },
      { text: "Advanced planning tools", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Business",
    description: "For growing ventures looking for more support.",
    monthlyPrice: 399,
    yearlyPrice: 319,
    icon: Building2,
    buttonText: "Choose Business",
    featured: false,
    features: [
      { text: "Access introductory resources", included: true },
      { text: "Explore business opportunities", included: true },
      { text: "Basic business planning guidance", included: true },
      { text: "Advanced planning tools", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I start using SparkVenture for free?",
    answer:
      "Yes. The proposed Free plan lets you explore introductory resources and discover what SparkVenture offers before deciding whether a paid plan suits your needs.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "The planned pricing structure allows you to choose a plan that fits your needs. Plan changes will depend on the subscription features implemented at launch.",
  },
  {
    question: "How does annual billing work?",
    answer:
      "The displayed annual rates are proposed discounted monthly equivalents for customers paying annually. The final billing frequency, total charge, and cancellation terms must be confirmed before launch.",
  },
  {
    question: "Does a subscription include access to the dashboard?",
    answer:
      "Dashboard access will depend on how the separate dashboard system is integrated with SparkVenture. The exact access rules will be confirmed before subscriptions go live.",
  },
];

function formatPrice(price) {
  return new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 sm:py-24 lg:px-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            <Sparkles size={15} />
            Simple, flexible pricing
          </span>

          <h1 className="mt-7 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Invest in your next{" "}
            <span className="text-blue-400">big move.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Whether you are just starting out or building a growing venture,
            find a SparkVenture plan designed around your entrepreneurial
            journey.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <Check size={17} className="text-cyan-400" />
              Options for different stages
            </span>
            <span className="flex items-center gap-2">
              <Check size={17} className="text-cyan-400" />
              Choose your plan
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your plan
            </h2>
            <p className="mt-4 text-slate-600">
              Start with what you need and explore more as you grow.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => setYearly(false)}
                aria-pressed={!yearly}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  !yearly
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setYearly(true)}
                aria-pressed={yearly}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  yearly
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Yearly
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    yearly
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid items-stretch gap-7 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;

              return (
                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${
                    plan.featured
                      ? "border-blue-600 bg-white shadow-xl shadow-blue-950/10 ring-1 ring-blue-600"
                      : "border-slate-200 bg-white shadow-sm hover:border-blue-200"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                      MOST POPULAR
                    </span>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                    {plan.description}
                  </p>

                  <div className="mt-7 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      R{formatPrice(price)}
                    </span>
                    <span className="text-sm text-slate-500">
                      / month
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {price === 0
                      ? "Free to get started"
                      : yearly
                        ? `R${formatPrice(price * 12)} billed annually`
                        : "Billed monthly"}
                  </p>

                  <Link
                    to="/register"
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "border border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {plan.buttonText}
                    <ArrowRight size={17} />
                  </Link>

                  <div className="my-7 border-t border-slate-100" />

                  <p className="text-sm font-semibold">
                    What's included
                  </p>

                  <ul className="mt-5 flex-1 space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.text}
                        className={`flex items-start gap-3 text-sm leading-5 ${
                          feature.included
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {feature.included ? (
                          <Check
                            size={18}
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                        ) : (
                          <X
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-300"
                          />
                        )}
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-slate-500">
            Proposed pricing for design and planning purposes. Features,
            billing terms, and actual subscription prices must be confirmed
            before accepting payments.
          </p>
        </div>
      </section>

      {/* Reassurance banner */}
      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-7 text-center sm:flex-row sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck size={25} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">Not sure which plan to choose?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Start with the Free plan and decide which resources best suit
              your business goals.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Get started
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-slate-50 px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              <HelpCircle size={17} />
              Frequently asked questions
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions? We've got answers.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="py-5">
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? -1 : index)
                  }
                  aria-expanded={openFaq === index}
                  className="flex w-full items-center justify-between gap-5 text-left"
                >
                  <span className="font-semibold text-slate-900">
                    {faq.question}
                  </span>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      openFaq === index
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {openFaq === index ? (
                      <X size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </span>
                </button>

                {openFaq === index && (
                  <p className="mt-4 pr-10 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Still have questions?{" "}
            <Link
              to="/about"
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Learn more about SparkVenture
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your next big move starts today.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-50">
            Take the first step towards building, developing, and growing
            your business.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Create your account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
