import { CREEPZ_CONTRACT_ADDRESS } from '../types';
import type { NftSale } from '../types';

// Blur API - Free, no API key required, best CORS support
const BLUR_API = 'https://core-api.prod.blur.io/v1';

// Try Blur API first (best free option)
async function fetchFromBlur(): Promise<NftSale[]> {
  try {
    const url = `${BLUR_API}/collections/${CREEPZ_CONTRACT_ADDRESS}/activity?filters=%7B%22types%22%3A%5B%22SALE%22%5D%7D`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Blur API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.activities && Array.isArray(data.activities)) {
      return data.activities
        .slice(0, 15)
        .map((activity: any) => ({
          id: activity.txHash || activity.activityId || `${activity.tokenId}-${activity.createdAt}`,
          token: {
            tokenId: activity.tokenId || activity.token?.tokenId || 'Unknown',
            image: activity.token?.imageUrl || activity.imageUrl || `https://img.reservoir.tools/images/v2/mainnet/${CREEPZ_CONTRACT_ADDRESS}%3A${activity.tokenId}?width=250`,
          },
          price: {
            amount: {
              decimal: activity.price?.amount ? parseFloat(activity.price.amount) : (activity.priceAmount ? parseFloat(activity.priceAmount) / 1e18 : 0),
            },
          },
          timestamp: activity.createdAt ? new Date(activity.createdAt).getTime() : Date.now(),
        }));
    }

    return [];
  } catch (error) {
    console.error('Blur fetch error:', error);
    throw error;
  }
}

// OpenSea API (requires API key for production, but may work without for limited requests)
async function fetchFromOpenSea(): Promise<NftSale[]> {
  try {
    // Using the collection slug approach (no API key needed for some endpoints)
    const url = `https://api.opensea.io/api/v2/events/collection/creepz`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // If you have an API key, add it here:
        // 'x-api-key': 'YOUR_OPENSEA_API_KEY'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.asset_events && Array.isArray(data.asset_events)) {
      return data.asset_events
        .filter((event: any) => event.event_type === 'sale')
        .slice(0, 15)
        .map((event: any) => ({
          id: event.id || `${event.asset?.token_id}-${event.created_date}`,
          token: {
            tokenId: event.asset?.token_id || 'Unknown',
            image: event.asset?.image_url || event.asset?.image_preview_url || '',
          },
          price: {
            amount: {
              decimal: event.total_price ? parseFloat(event.total_price) / 1e18 : 0,
            },
          },
          timestamp: event.created_date ? new Date(event.created_date).getTime() : Date.now(),
        }));
    }

    return [];
  } catch (error) {
    console.error('OpenSea fetch error:', error);
    throw error;
  }
}

// Fallback: Generate mock data for demonstration
function generateMockSales(): NftSale[] {
  const mockSales: NftSale[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    mockSales.push({
      id: `mock-${i}`,
      token: {
        tokenId: String(Math.floor(Math.random() * 10000)),
        image: `https://via.placeholder.com/40x40/008080/FFFFFF?text=Creepz`,
      },
      price: {
        amount: {
          decimal: parseFloat((Math.random() * 2).toFixed(3)),
        },
      },
      timestamp: now - (i * 3600000), // Each sale 1 hour apart
    });
  }

  return mockSales;
}

export async function fetchCreepzSales(): Promise<NftSale[]> {
  // Try Blur API first (free, no API key required)
  try {
    console.log('Attempting to fetch from Blur API...');
    const sales = await fetchFromBlur();
    if (sales.length > 0) {
      console.log(`✅ Successfully fetched ${sales.length} sales from Blur`);
      return sales;
    }
  } catch (error) {
    console.warn('⚠️ Blur API failed, trying OpenSea...', error);
  }

  // Try OpenSea as fallback
  try {
    console.log('Attempting to fetch from OpenSea API...');
    const sales = await fetchFromOpenSea();
    if (sales.length > 0) {
      console.log(`✅ Successfully fetched ${sales.length} sales from OpenSea`);
      return sales;
    }
  } catch (error) {
    console.warn('⚠️ OpenSea API failed, using mock data...', error);
  }

  // If all APIs fail, return mock data so the window still shows something
  console.log('📊 Using mock sales data for demonstration');
  return generateMockSales();
}
