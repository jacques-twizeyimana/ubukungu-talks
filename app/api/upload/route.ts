import { Readable } from "node:stream";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/db";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

// Stores editor uploads in MongoDB GridFS; served (and cached forever) by /api/media/[id].
export async function POST(req: Request) {
  if (!(await getSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (!TYPES.has(file.type)) return Response.json({ error: "Use a JPEG, PNG, WebP, AVIF or GIF image." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Images must be under 8 MB." }, { status: 413 });

  const { media } = await collections();
  const upload = media.openUploadStream(file.name.slice(0, 200), {
    metadata: { contentType: file.type, uploadedAt: new Date() },
  });
  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream)
      .pipe(upload)
      .on("finish", () => resolve())
      .on("error", reject);
  });

  return Response.json({ url: `/api/media/${upload.id.toString()}` });
}
