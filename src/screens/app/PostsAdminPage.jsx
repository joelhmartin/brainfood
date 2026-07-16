"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Calendar,
  X,
} from "lucide-react";
import { usePostsStore } from "../../stores/posts.store.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { ImageUpload } from "../../components/ui/ImageUpload.jsx";
import { FormField } from "../../components/ui/FormField.jsx";
import { estimateReadTime } from "../../lib/mappers.js";

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
  author: "",
  category: "Recovery",
  tags: "",
  image: "",
  excerpt: "",
  body: "",
  published: false,
  featured: false,
};

const FIELD =
  "w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";

function PostFormModal({ post, onClose, onSave }) {
  // Tags round-trip as a comma-separated string in the form and an array everywhere else.
  const [form, setForm] = useState(
    post ? { ...post, tags: (post.tags ?? []).join(", ") } : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Modal stays open on failure so the author does not lose a long post.
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  };

  const readTime = estimateReadTime(form.body);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <h2 className="font-heading font-bold text-xl">
            {post ? "Edit Post" : "New Post"}
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
            <FormField label="Author">
              <input
                type="text"
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                className={FIELD}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={FIELD}
              >
                <option>Recovery</option>
                <option>Wellness</option>
                <option>Family</option>
                <option>Community</option>
                <option>News</option>
              </select>
            </FormField>
            <FormField label="Tags (comma separated)">
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="recovery, boundaries"
                className={FIELD}
              />
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

          <FormField
            label={
              <>
                Full Content (Markdown)
                <span className="ml-2 font-normal normal-case tracking-normal text-navy/30">
                  ~{readTime} min read
                </span>
              </>
            }
          >
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={12}
              className={`${FIELD} font-mono resize-none`}
            />
          </FormField>

          <div className="flex items-center gap-6 pt-2">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500/20"
              />
              <span className="text-sm text-navy/70">Featured</span>
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
              {saving ? "Saving…" : post ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PostsAdminPage() {
  const posts = usePostsStore((s) => s.posts);
  const status = usePostsStore((s) => s.status);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);
  const createPost = usePostsStore((s) => s.createPost);
  const updatePost = usePostsStore((s) => s.updatePost);
  const deletePost = usePostsStore((s) => s.deletePost);
  const { addToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /** @returns true on success, so the modal knows whether it may close. */
  const handleSave = async (data) => {
    try {
      if (editingPost) {
        await updatePost(editingPost.id, data);
        addToast({ message: "Post saved.", type: "success" });
      } else {
        await createPost(data);
        addToast({ message: "Post created.", type: "success" });
      }
      return true;
    } catch (err) {
      addToast({ message: err.message, type: "error" });
      return false;
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`))
      return;
    try {
      await deletePost(post.id);
      addToast({ message: "Post deleted.", type: "success" });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    }
  };

  const toggle = async (post, field) => {
    try {
      await updatePost(post.id, { [field]: !post[field] });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    }
  };

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-navy tracking-tight">
            Blog Posts
          </h1>
          <p className="text-navy/50 text-sm mt-1">
            Write and manage blog posts.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPost(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load posts.{" "}
          <button onClick={fetchPosts} className="font-medium underline">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-300 py-16 text-center">
          <p className="text-navy/50 text-sm">No posts yet.</p>
          <p className="text-navy/30 text-xs mt-1">Write one to get started.</p>
        </div>
      )}

      {status === "ready" && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-200/60 hover:shadow-sm transition-shadow"
            >
              {post.image && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={post.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-heading font-bold text-sm text-navy truncate">
                    {post.title}
                  </h3>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      post.published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-surface-200 text-navy/40"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                  {post.featured && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-navy/40 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(post.date)}
                  </span>
                  <span>{post.category}</span>
                  <span>{post.readTime} min read</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggle(post, "featured")}
                  className={`p-2 rounded-lg transition-colors hover:bg-amber-50 ${
                    post.featured
                      ? "text-amber-500"
                      : "text-navy/30 hover:text-amber-500"
                  }`}
                  title={post.featured ? "Unfeature" : "Feature"}
                >
                  <Star
                    size={15}
                    fill={post.featured ? "currentColor" : "none"}
                  />
                </button>
                <button
                  onClick={() => toggle(post, "published")}
                  className="p-2 rounded-lg text-navy/30 hover:text-navy/70 hover:bg-surface-100 transition-colors"
                  title={post.published ? "Unpublish" : "Publish"}
                >
                  {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => {
                    setEditingPost(post);
                    setShowModal(true);
                  }}
                  className="p-2 rounded-lg text-navy/30 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(post)}
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
        <PostFormModal
          post={editingPost}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
