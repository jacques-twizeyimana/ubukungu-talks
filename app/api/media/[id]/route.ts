import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";

// Images are immutable once uploaded (new upload = new id), so they can be cached forever.
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
  const { media } = await collections();
  const _id = new ObjectId(id);
  const [file] = await media.find({ _id }).limit(1).toArray();
  if (!file) return new Response("Not found", { status: 404 });

  const stream = media.openDownloadStream(_id);
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });
  return new Response(body, {
    headers: {
      "content-type": String(file.metadata?.contentType ?? "application/octet-stream"),
      "content-length": String(file.length),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
