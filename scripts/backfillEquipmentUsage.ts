// Run this script with: npm run backfill-equipment-usage
// Requires tsx (added as a devDependency)
import { LogManager } from '../src/utils/logManager';
import 'dotenv/config';
console.log('Loaded VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);

(async () => {
  try {
    console.log('Starting equipment usage duration backfill...');
    const result = await LogManager.backfillEquipmentUsageDurations();
    console.log('Backfill complete.');
    console.log(`Updated: ${result.updated}, Skipped: ${result.skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
})(); 