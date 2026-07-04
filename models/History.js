import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  duration: {
    type: Number, // duration in seconds
    default: 0,
  },
  format: {
    type: String, // MP4, MP3
    required: true,
  },
  quality: {
    type: String, // 1080p, 720p, 320kbps
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'downloading'],
    default: 'completed',
  },
  fileSize: {
    type: String, // e.g. "12.4 MB"
    default: 'Unknown',
  },
  platform: {
    type: String, // youtube, vimeo, tiktok, etc.
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.History || mongoose.model('History', HistorySchema);
