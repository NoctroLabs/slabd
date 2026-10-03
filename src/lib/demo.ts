import type { SlabCard } from '../components/Slab'
import { SUPABASE_URL } from './supabase'

/** The card shown in the marketing hero. A real one from the collection
 *  rather than a mock, so the hero shows exactly what the product renders,
 *  and hardcoded rather than fetched so the hero never depends on a network
 *  round trip to paint. */
export const heroCard: SlabCard = {
  player: 'Stone Cold',
  year: '2024',
  setName: 'Panini Flawless',
  autoType: 'On Card Auto',
  serialNum: '18',
  serialTotal: '25',
  serialKind: 'Serial',
  grade: null,
  uniqueSerial: '1000000019',
  imageUrl: `${SUPABASE_URL}/storage/v1/object/public/card-images/2cd8913c-c530-4427-87d8-8a48079ba691/cf3c4a3e-b436-46bf-8a1a-bcc943b4d8ec.jpg`,
}
