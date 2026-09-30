import { getIndexItems } from "@/lib/essentials";
import { PricesEditor } from "./PricesEditor";

export const metadata = { title: "Essentials Index" };

export default async function AdminIndexPage() {
  const items = await getIndexItems();
  return <PricesEditor items={JSON.parse(JSON.stringify(items))} />;
}
