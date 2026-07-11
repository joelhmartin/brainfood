import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { useAuthStore } from "./stores/auth.store.js";
import { useSettingsStore } from "./stores/settings.store.js";
import { useEventsStore } from "./stores/events.store.js";
import { usePostsStore } from "./stores/posts.store.js";
import { RequireAuth } from "./guards/RequireAuth.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";

// Auth pages. No register page: sign-up is disabled, admins arrive by invitation.
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage.jsx";
import { AcceptInvitePage } from "./pages/auth/AcceptInvitePage.jsx";

// Dashboard pages
import { DashboardPage } from "./pages/app/DashboardPage.jsx";
import { SettingsPage } from "./pages/app/SettingsPage.jsx";
import { MembersPage } from "./pages/app/MembersPage.jsx";
import { EventsAdminPage } from "./pages/app/EventsAdminPage.jsx";
import { PostsAdminPage } from "./pages/app/PostsAdminPage.jsx";

// Marketing pages
import { HomePage } from "./pages/marketing/Home.jsx";
import { AboutPage } from "./pages/marketing/About.jsx";
import { ProductPage } from "./pages/marketing/Product.jsx";
import { ContactPage } from "./pages/marketing/Contact.jsx";
import { CaseSubmissionPage } from "./pages/marketing/CaseSubmission.jsx";
import { ComingSoonPage } from "./pages/marketing/ComingSoon.jsx";
import { EventsPage } from "./pages/marketing/Events.jsx";
import { EventDetailPage } from "./pages/marketing/EventDetail.jsx";
import { BlogPage } from "./pages/marketing/Blog.jsx";
import { BlogPostPage } from "./pages/marketing/BlogPost.jsx";
import { ServicesPage } from "./pages/marketing/Services.jsx";
import { ServiceDetailPage } from "./pages/marketing/ServiceDetail.jsx";
import { NotFoundPage } from "./pages/marketing/NotFound.jsx";

import { Navbar } from "./components/marketing/Navbar.jsx";
import { Footer } from "./components/marketing/Footer.jsx";
import { CONTENT } from "./config/site.js";
import { BreakpointProvider } from "./hooks/useBreakpoint.jsx";

function MarketingLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/**
 * Tells the prerender script that this route has finished loading its content.
 *
 * scripts/prerender.mjs waits for [data-prerender-ready] before snapshotting the HTML.
 * With no signal it would capture a loading spinner, and crawlers would be served a
 * spinner. The flag is cleared on navigation and re-set once the stores settle.
 */
function PrerenderSignal() {
  const location = useLocation();
  const eventsStatus = useEventsStore((s) => s.status);
  const postsStatus = usePostsStore((s) => s.status);
  const settingsStatus = useSettingsStore((s) => s.status);

  const settled = (s) => s === "ready" || s === "error";
  const ready = settled(eventsStatus) && settled(postsStatus) && settled(settingsStatus);

  useEffect(() => {
    document.documentElement.removeAttribute("data-prerender-ready");
  }, [location.pathname]);

  useEffect(() => {
    if (ready) document.documentElement.setAttribute("data-prerender-ready", "true");
  }, [ready, location.pathname]);

  return null;
}

function AppRoutes() {
  const init = useAuthStore((s) => s.init);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);

  useEffect(() => {
    init();
    // Fetched once at the root rather than per page: the footer needs settings on every
    // route, and the nav, blog, and events pages read the same two collections.
    fetchSettings();
    fetchEvents();
    fetchPosts();
  }, [init, fetchSettings, fetchEvents, fetchPosts]);

  return (
    <>
      <PrerenderSignal />
      <Routes>
        {/* Marketing */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path={CONTENT.events.listPath} element={<EventsPage />} />
          <Route
            path={`${CONTENT.events.listPath}${CONTENT.events.paginationSlug}/:page`}
            element={<EventsPage />}
          />
          <Route path={`${CONTENT.events.prefix}/:slug`} element={<EventDetailPage />} />

          <Route path={CONTENT.blog.listPath} element={<BlogPage />} />
          <Route
            path={`${CONTENT.blog.listPath}${CONTENT.blog.paginationSlug}/:page`}
            element={<BlogPage />}
          />
          <Route path={`${CONTENT.blog.prefix}/:slug`} element={<BlogPostPage />} />

          <Route path="/submit-case" element={<CaseSubmissionPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />

          <Route path="/about/team" element={<ComingSoonPage />} />
          <Route path="/resources/videos" element={<ComingSoonPage />} />

          {/* A real 404, not a redirect home — see NotFound.jsx. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Auth */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/accept-invite" element={<AcceptInvitePage />} />

        {/* Dashboard */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="posts" element={<PostsAdminPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BreakpointProvider>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </BreakpointProvider>
  );
}
