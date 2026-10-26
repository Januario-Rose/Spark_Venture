import React from 'react'
import { Link } from "react-router-dom";
import Hero from '../components/HomeHero'
import {
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Handshake,
} from "lucide-react";

const benefits = [
  {
    icon: Lightbulb,
    title: "Start with confidence",
    description:
      "Turn your business idea into a clear plan with guidance and practical resources.",
  },
  {
    icon: TrendingUp,
    title: "Grow your business",
    description:
      "Discover tools and opportunities that help you take your business forward.",
  },
  {
    icon: Handshake,
    title: "Find opportunities",
    description:
      "Explore resources, support programmes, and opportunities for South African entrepreneurs.",
  },
];
const Home = () => {
  return (
   
    <div>
        <Hero />
        {/* Business overview */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            About SparkVenture
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Your partner in the business journey
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            SparkVenture helps aspiring and established entrepreneurs
            navigate the challenges of starting and growing a business.
            Find useful resources, discover opportunities, and take
            practical steps towards building a sustainable business.
          </p>

          <Link
            to="/about"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800"
          >
            Learn more about us <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Three key benefits */}
      <section className="bg-slate-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              What we offer
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Everything starts with an opportunity
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icon size={25} />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Simple call to action */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to take the next step?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-50">
            Start exploring the resources and opportunities that can
            help move your business forward.
          </p>

          <Link
            to="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Get started <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
    
  )
}

export default Home