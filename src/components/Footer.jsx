
import { Link } from "react-router-dom";
import footerLogo from "../assets/footer-logo.png";
import {
  ArrowUpRight,
  Mail,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex shrink-0 items-center gap-2">
                      <img
                        src={footerLogo}
                        alt="Spark-Venture"
                        className="h-9 w-auto object-contain"
                      />
                    </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Helping entrepreneurs turn ideas into opportunities and build
              businesses with confidence.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Explore
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link className="transition hover:text-white" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/features">
                  Features
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/pricing">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/resources">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link className="transition hover:text-white" to="/about">
                  About us
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/login">
                  Sign in
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/register">
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Get in touch
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Have a question or want to learn more about SparkVenture?
            </p>

            <a
              href="mailto:hello@sparkventure.co.za"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              <Mail size={16} />
              Contact us
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SparkVenture. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5">
            <Link
              to="/privacy"
              className="transition hover:text-white"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="transition hover:text-white"
            >
              Terms of service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
