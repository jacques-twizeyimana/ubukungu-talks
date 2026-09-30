import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

// Social card for stories without their own photo.
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F3EEE4",
          color: "#16140F",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>
          <span style={{ color: "#B8321F" }}>{article?.section ?? "Rwanda's economy"}</span>
          <span style={{ color: "#5B554A" }}>{SITE.name}</span>
        </div>
        <div style={{ display: "flex", fontSize: article && article.title.length > 70 ? 60 : 74, lineHeight: 1.05, letterSpacing: -1 }}>
          {article?.title ?? SITE.motto}
        </div>
        <div style={{ display: "flex", borderTop: "3px solid #16140F", paddingTop: 20, fontSize: 26, color: "#5B554A" }}>
          The economy, as it&apos;s lived — not as it&apos;s reported.
        </div>
      </div>
    ),
    size,
  );
}
