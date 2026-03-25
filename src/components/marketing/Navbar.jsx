import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Facebook, Instagram } from "lucide-react";
import gsap from "gsap";
import LogoFull from "../../images/logoFull.jsx";

const NAV_LINKS = [
  { label: "About", to: "/about" },
  {
    label: "Services",
    children: [
      { label: "Recovery & Mental Health Coaching", to: "/services/coaching" },
      { label: "Sober Companion Services",          to: "/services/sober-companion" },
      { label: "Experiential Integration",          to: "/services/experiential" },
      { label: "Family Coaching & Support",         to: "/services/family" },
      { label: "Collaborative Care",                to: "/services/collaborative" },
    ],
  },
  { label: "Contact", to: "/contact" },
];

const SOCIALS = [
  { icon: Facebook,  href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

/* ─── Desktop nav item (with optional dropdown) ─── */
function NavItem({ link, scrolled, isActive }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef(null);

  const enter = () => { clearTimeout(timeout.current); setOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setOpen(false), 150); };

  const baseClass = `px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1`;
  const colorClass = isActive
    ? scrolled
      ? "bg-brand-500/10 text-brand-500"
      : "bg-white/15 text-white"
    : scrolled
    ? "text-navy/70 hover:text-navy hover:bg-surface-200/60"
    : "text-white/70 hover:text-white hover:bg-white/10";

  if (!link.children) {
    return (
      <Link to={link.to} className={`${baseClass} ${colorClass}`}>
        {link.label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button className={`${baseClass} ${colorClass}`}>
        {link.label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 pt-2 z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-surface-300/50 shadow-xl shadow-navy/10 py-2 min-w-[260px]">
            {link.children.map((child) => (
              <Link
                key={child.label}
                to={child.to}
                className="block px-4 py-2.5 text-sm text-navy/70 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile nav group (expandable) ─── */
function MobileNavGroup({ link, isActive, onNavigate }) {
  const [open, setOpen] = useState(false);

  if (!link.children) {
    return (
      <Link
        to={link.to}
        onClick={onNavigate}
        className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-500/10 text-brand-500"
            : "text-navy/70 hover:text-navy hover:bg-surface-200/60"
        }`}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-navy/70 hover:text-navy hover:bg-surface-200/60 transition-colors"
      >
        {link.label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-4 border-l-2 border-surface-300/30 pl-2 mb-1">
          {link.children.map((child) => (
            <Link
              key={child.label}
              to={child.to}
              onClick={onNavigate}
              className="block px-4 py-2 rounded-xl text-sm text-navy/50 hover:text-brand-500 hover:bg-brand-50 transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuRef.current) return;
    if (mobileOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }
      );
    }
  }, [mobileOpen]);

  const isActive = (link) => {
    if (link.to && location.pathname === link.to) return true;
    if (link.children) return link.children.some((c) => location.pathname === c.to);
    return false;
  };

  return (
    <>
      {/* Social bar — fades out on scroll */}
      <div
        className={`fixed top-3 right-6 z-50 flex items-center gap-3 transition-all duration-500 ${
          scrolled ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100"
        }`}
      >
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-300"
            aria-label={s.label}
          >
            <s.icon size={14} />
          </a>
        ))}
      </div>

      <nav
        ref={navRef}
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out
          ${
            scrolled
              ? "top-4 bg-white/80 backdrop-blur-xl border border-surface-300/50 shadow-lg shadow-navy/5"
              : "top-8 bg-transparent border border-transparent"
          }
          rounded-full px-3 py-2 md:px-5 md:py-2.5 max-w-6xl w-[calc(100%-2rem)]`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover-lift flex-shrink-0">
            <LogoFull className="h-10 w-auto" dark={scrolled} />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                scrolled={scrolled}
                isActive={isActive(link)}
              />
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/contact"
              className={`hidden lg:inline-flex px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                scrolled
                  ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                  : "bg-white text-navy hover:bg-brand-50"
              }`}
            >
              Get Started
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors duration-300 ${
                scrolled ? "text-navy hover:bg-surface-200" : "text-white hover:bg-white/10"
              }`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden mt-3 py-3 px-1 bg-white rounded-3xl border border-surface-300/50 shadow-xl flex flex-col gap-0.5"
          >
            {NAV_LINKS.map((link) => (
              <MobileNavGroup
                key={link.label}
                link={link}
                isActive={isActive(link)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
            <div className="mt-3 px-4 pb-2">
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-6 py-3 rounded-2xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
