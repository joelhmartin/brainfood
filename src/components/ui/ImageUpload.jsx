import { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { supabase } from "../../lib/supabase.js";
import { useToast } from "./Toast.jsx";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Drag-and-drop image upload into the Supabase `media` bucket.
 *
 * Returns a public URL through onChange, so the rest of the form keeps storing a
 * plain string exactly as it did when images were pasted URLs. Pasting a URL still
 * works — useful for stock photos that are already hosted.
 *
 * Only admins can write to the bucket (storage RLS policy); the bucket is
 * world-readable because these images are served on the public site.
 */
export function ImageUpload({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  const upload = async (file) => {
    if (!ACCEPTED.includes(file.type)) {
      addToast({ message: "Use a JPG, PNG, WebP, AVIF, or GIF.", type: "error" });
      return;
    }
    if (file.size > MAX_BYTES) {
      addToast({ message: "That image is over 5 MB. Try a smaller one.", type: "error" });
      return;
    }

    setUploading(true);
    try {
      // Random prefix: two files named "hero.jpg" must not collide, and the original
      // name is preserved for recognizability in the storage browser.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
      const path = `${crypto.randomUUID().slice(0, 8)}-${safeName}`;

      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (error) throw new Error(error.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);

      onChange(publicUrl);
    } catch (err) {
      addToast({ message: err.message || "Upload failed.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200">
          <img src={value} alt="" className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={clsx(
            "flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-gray-400",
            uploading && "cursor-wait opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Uploading…</span>
            </>
          ) : (
            <>
              <UploadCloud size={22} className="text-gray-400" />
              <span className="text-sm text-gray-600">Drag an image here, or click to browse</span>
              <span className="text-xs text-gray-400">JPG, PNG, WebP or GIF · up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = ""; // let the same file be re-picked after a removal
        }}
      />

      <input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
