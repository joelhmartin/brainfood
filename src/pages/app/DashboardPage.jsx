import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FileText, ArrowRight, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { H1, Text } from "../../components/ui/Typography.jsx";
import { useEventsStore } from "../../stores/events.store.js";
import { usePostsStore } from "../../stores/posts.store.js";
import { useSettingsStore } from "../../stores/settings.store.js";
import { ROUTES } from "../../config/routes.js";

function StatCard({ icon: Icon, label, total, drafts, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-brand-500" />
        <ArrowRight
          size={14}
          className="text-gray-300 transition-transform group-hover:translate-x-0.5"
        />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{total}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {drafts > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          {drafts} {drafts === 1 ? "draft" : "drafts"} not yet published
        </p>
      )}
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const events = useEventsStore((s) => s.events);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const posts = usePostsStore((s) => s.posts);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchEvents();
    fetchPosts();
    fetchSettings();
  }, [fetchEvents, fetchPosts, fetchSettings]);

  const eventDrafts = events.filter((e) => !e.published).length;
  const postDrafts = posts.filter((p) => !p.published).length;

  return (
    <div className="space-y-6">
      <div>
        <H1>Welcome, {user?.name}</H1>
        <Text muted className="mt-1">
          Create and publish events and blog posts for the public site.
        </Text>
      </div>

      {/* The single most consequential piece of state on this site right now. */}
      {!settings.seoIndexable && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">This site is hidden from Google.</p>
            <p className="mt-0.5 text-xs">
              Correct before launch. When you go live on the real domain, turn on indexing in{" "}
              <Link to={ROUTES.SETTINGS} className="font-medium underline">
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={CalendarDays}
          label="Events"
          total={events.length}
          drafts={eventDrafts}
          to={ROUTES.EVENTS}
        />
        <StatCard
          icon={FileText}
          label="Blog posts"
          total={posts.length}
          drafts={postDrafts}
          to={ROUTES.POSTS}
        />
      </div>
    </div>
  );
}
