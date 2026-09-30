import Image from "next/image";
import type { LeadImage } from "@/lib/types";

/**
 * Lead photo, or the design's striped placeholder when a story has no image yet.
 * `priority` should be set for the one above-the-fold image per page (LCP).
 */
export function StoryImage({
  image,
  ratio,
  sizes,
  priority = false,
  small = false,
  placeholderLabel,
  className = "",
}: {
  image: LeadImage | null;
  ratio: string;
  sizes: string;
  priority?: boolean;
  small?: boolean;
  placeholderLabel?: string;
  className?: string;
}) {
  if (!image) {
    return (
      <div
        className={`${small ? "placeholder-stripes-sm" : "placeholder-stripes"} flex items-end p-3 font-mono text-xs leading-snug text-muted ${className}`}
        style={{ aspectRatio: ratio }}
        aria-hidden
      >
        {placeholderLabel}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-wash ${className}`} style={{ aspectRatio: ratio }}>
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
