import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, X } from "lucide-react";
import { useEventsStore } from "../../stores/events.store.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { ImageUpload } from "../../components/ui/ImageUpload.jsx";
import { FormField } from "../../components/ui/FormField.jsx";

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  title: "",
  date: "",
  time: "",
  location: "",
  image: "",
  excerpt: "",
  body: "",
  category: "Community",
  published: false,
};

const FIELD =
  "w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";

function EventFormModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // The modal stays open if the save fails, so the author does not lose their work.
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <h2 className="font-heading font-bold text-xl">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              className={FIELD}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
                className={FIELD}
              />
            </FormField>
            <FormField label="Time">
              <input
                type="text"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                placeholder="e.g. 8:00 AM"
                className={FIELD}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={FIELD}
              />
            </FormField>
            <FormField label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={FIELD}
              >
                <option>Community</option>
                <option>Workshop</option>
                <option>Social</option>
                <option>Fundraiser</option>
                <option>Other</option>
              </select>
            </FormField>
          </div>

          <ImageUpload
            label="Cover image"
            value={form.image}
            onChange={(url) => set("image", url)}
          />

          <FormField label="Excerpt (short description)">
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              className={`${FIELD} resize-none`}
            />
          </FormField>

          <FormField label="Full Content (Markdown)">
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={10}
              className={`${FIELD} font-mono resize-none`}
            />
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500/20"
              />
              <span className="text-sm text-navy/70">
                Published (visible on site)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-navy/60 hover:bg-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : event ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EventsAdminPage() {
  const events = useEventsStore((s) => s.events);
  const status = useEventsStore((s) => s.status);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const createEvent = useEventsStore((s) => s.createEvent);
  const updateEvent = useEventsStore((s) => s.updateEvent);
  const deleteEvent = useEventsStore((s) => s.deleteEvent);
  const { addToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /** @returns true on success, so the modal knows whether it may close. */
  const handleSave = async (data) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        addToast({ message: "Event saved.", type: "success" });
      } else {
        await createEvent(data);
        addToast({ message: "Event created.", type: "success" });
      }
      return true;
    } catch (err) {
      addToast({ message: err.message, type: "error" });
      return false;
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`))
      return;
    try {
      await deleteEvent(event.id);
      addToast({ message: "Event deleted.", type: "success" });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    }
  };

  const handleTogglePublish = async (event) => {
    try {
      await updateEvent(event.id, { published: !event.published });
      addToast({
        message: event.published ? "Event unpublished." : "Event published.",
        type: "success",
      });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    }
  };

  const sorted = [...events].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-navy tracking-tight">
            Events
          </h1>
          <p className="text-navy/50 text-sm mt-1">
            Create and manage community events.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load events.{" "}
          <button onClick={fetchEvents} className="font-medium underline">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-300 py-16 text-center">
          <p className="text-navy/50 text-sm">No events yet.</p>
          <p className="text-navy/30 text-xs mt-1">
            Create one to get started.
          </p>
        </div>
      )}

      {status === "ready" && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((event) => (
            <div
              key={event.id}
              data-event-row={event.slug}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-200/60 hover:shadow-sm transition-shadow"
            >
              {event.image && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={event.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-heading font-bold text-sm text-navy truncate">
                    {event.title}
                  </h3>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      event.published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-surface-200 text-navy/40"
                    }`}
                  >
                    {event.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-navy/40 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(event.date)}
                  </span>
                  <span>{event.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleTogglePublish(event)}
                  className="p-2 rounded-lg text-navy/30 hover:text-navy/70 hover:bg-surface-100 transition-colors"
                  title={event.published ? "Unpublish" : "Publish"}
                >
                  {event.published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => {
                    setEditingEvent(event);
                    setShowModal(true);
                  }}
                  className="p-2 rounded-lg text-navy/30 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(event)}
                  className="p-2 rounded-lg text-navy/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
