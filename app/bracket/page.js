import BracketPageClient from '@/components/bracket/BracketPageClient';
import { fetchPublicBracket } from '@/lib/publicBracket';

export const revalidate = 30;

export default async function BracketPage() {
  const initialBracketData = await fetchPublicBracket();
  return <BracketPageClient initialBracketData={initialBracketData} />;
}