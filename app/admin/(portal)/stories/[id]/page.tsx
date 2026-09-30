import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/articles";
import { StoryEditor } from "@/components/admin/editor/StoryEditor";

export async function generateMetadata({ params }: PageProps<"/admin/stories/[id]">) {
  const { id } = await params;
  const a = await getArticleById(id);
  return { title: a?.title ? `Editing: ${a.title}` : "New story" };
}

export default async function EditStoryPage({ params }: PageProps<"/admin/stories/[id]">) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();
  // key: remount the editor when switching between stories.
  return <StoryEditor key={article.id} article={article} />;
}
