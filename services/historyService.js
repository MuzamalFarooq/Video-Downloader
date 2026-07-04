import dbConnect from '@/lib/db';
import History from '@/models/History';
import * as fallbackDb from '@/lib/dbFallback';

// Helper to determine if we use MongoDB
async function isMongoAvailable() {
  try {
    const connection = await dbConnect();
    return connection !== null;
  } catch (e) {
    return false;
  }
}

// Helper to parse file size string (like "54.2 MB" or "1.2 GB") to MB
function parseSizeToMB(sizeStr) {
  if (!sizeStr || sizeStr === 'Unknown') return 0;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return 0;
  if (sizeStr.toUpperCase().includes('GB')) {
    return num * 1024;
  }
  if (sizeStr.toUpperCase().includes('KB')) {
    return num / 1024;
  }
  return num; // Default MB
}

// Helper to format MB back to readable string
function formatMB(mb) {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export async function addHistory(record) {
  const isMongo = await isMongoAvailable();
  
  const recordData = {
    url: record.url,
    title: record.title,
    thumbnail: record.thumbnail,
    duration: record.duration,
    format: record.format,
    quality: record.quality,
    fileSize: record.fileSize || 'Unknown',
    platform: record.platform,
    isFavorite: false,
    downloadedAt: new Date()
  };

  if (isMongo) {
    try {
      const created = await History.create(recordData);
      return JSON.parse(JSON.stringify(created));
    } catch (error) {
      console.error('Mongo save failed, falling back to JSON db:', error);
    }
  }

  // Fallback DB
  const list = await fallbackDb.readHistory();
  const newRecord = {
    _id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...recordData,
    downloadedAt: new Date().toISOString()
  };
  list.unshift(newRecord);
  await fallbackDb.writeHistory(list);
  return newRecord;
}

export async function getHistory({ search = '', platform = 'all', sort = 'newest', page = 1, limit = 10 } = {}) {
  const isMongo = await isMongoAvailable();
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.max(1, parseInt(limit));
  const skip = (parsedPage - 1) * parsedLimit;

  if (isMongo) {
    try {
      const query = {};
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      if (platform && platform !== 'all') {
        query.platform = platform;
      }

      let sortQuery = { downloadedAt: -1 };
      if (sort === 'oldest') {
        sortQuery = { downloadedAt: 1 };
      } else if (sort === 'title') {
        sortQuery = { title: 1 };
      } else if (sort === 'duration') {
        sortQuery = { duration: -1 };
      }

      const items = await History.find(query).sort(sortQuery).skip(skip).limit(parsedLimit);
      const total = await History.countDocuments(query);
      
      return {
        items: JSON.parse(JSON.stringify(items)),
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit)
      };
    } catch (error) {
      console.error('Mongo get history failed, falling back to JSON db:', error);
    }
  }

  // Fallback DB
  let list = await fallbackDb.readHistory();

  // Search filter
  if (search) {
    const lowerSearch = search.toLowerCase();
    list = list.filter(item => item.title.toLowerCase().includes(lowerSearch));
  }

  // Platform filter
  if (platform && platform !== 'all') {
    list = list.filter(item => item.platform === platform);
  }

  // Sorting
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.downloadedAt) - new Date(b.downloadedAt));
  } else if (sort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'duration') {
    list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  } else {
    // Newest default
    list.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
  }

  const total = list.length;
  const paginatedList = list.slice(skip, skip + parsedLimit);

  return {
    items: paginatedList,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit)
  };
}

export async function toggleFavorite(id) {
  const isMongo = await isMongoAvailable();

  if (isMongo) {
    try {
      const item = await History.findById(id);
      if (item) {
        item.isFavorite = !item.isFavorite;
        await item.save();
        return JSON.parse(JSON.stringify(item));
      }
      return null;
    } catch (error) {
      console.error('Mongo toggle favorite failed, falling back to JSON db:', error);
    }
  }

  // Fallback DB
  const list = await fallbackDb.readHistory();
  const index = list.findIndex(item => item._id === id);
  if (index !== -1) {
    list[index].isFavorite = !list[index].isFavorite;
    await fallbackDb.writeHistory(list);
    return list[index];
  }
  return null;
}

export async function deleteHistory(id) {
  const isMongo = await isMongoAvailable();

  if (isMongo) {
    try {
      const result = await History.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Mongo delete history failed, falling back to JSON db:', error);
    }
  }

  // Fallback DB
  const list = await fallbackDb.readHistory();
  const filtered = list.filter(item => item._id !== id);
  if (filtered.length !== list.length) {
    await fallbackDb.writeHistory(filtered);
    return true;
  }
  return false;
}

export async function getStats() {
  const isMongo = await isMongoAvailable();
  let allRecords = [];

  if (isMongo) {
    try {
      allRecords = await History.find({});
    } catch (error) {
      console.error('Mongo stats fetch failed, falling back to JSON db:', error);
      allRecords = await fallbackDb.readHistory();
    }
  } else {
    allRecords = await fallbackDb.readHistory();
  }

  const totalDownloads = allRecords.length;
  const favoritesCount = allRecords.filter(item => item.isFavorite).length;

  let totalSizeMB = 0;
  const platformCounts = {};

  allRecords.forEach(record => {
    // Platform distribution
    const pf = record.platform || 'other';
    platformCounts[pf] = (platformCounts[pf] || 0) + 1;

    // File size accumulation
    totalSizeMB += parseSizeToMB(record.fileSize);
  });

  return {
    totalDownloads,
    totalSizeSaved: formatMB(totalSizeMB),
    favoritesCount,
    platformDistribution: platformCounts
  };
}
