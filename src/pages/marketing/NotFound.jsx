import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSeo } from "../../lib/seo.js";
import { CONTENT } from "../../config/site.js";

/**
 * A real 404.
 *
 * The catch-all route used to `<Navigate to="/" replace />`. That tells a crawler
 * every mistyped or dead URL is a valid page that redirects home, so bad URLs get
 * indexed and link equity leaks. Rendering a 404 page with noindex is the correct
 * behavior. (A static host cannot return an HTTP 404 status for an SPA route; the
 * noindex tag is what actually keeps these out of the index.)
 */
export function NotFoundPage() {
  useSeo({ title: "Page not found", path: "/404", noindex: true });

  return (
    <section className="flex min-h-[60dvh] items-center justify-center px-6 py-24">
      <div className="text-center">
        <p className="font-mono text-xs tracking-wider text-brand-500">404</p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-navy md:text-5xl">
          We couldn't find that page.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-navy/55">
          The link may be out of date, or the page may have moved.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <ArrowLeft size={14} />
            Back home
          </Link>
          <Link
            to={CONTENT.blog.listPath}
            className="rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-navy/70 transition-colors hover:bg-surface-100"
          >
            Read the blog
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-navy/70 transition-colors hover:bg-surface-100"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
