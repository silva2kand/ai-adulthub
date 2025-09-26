import { Router } from 'express';
import VideoScraper from '../scraper/videoScraper';

const router = Router();
const scraper = new VideoScraper();

// Cache for scraped videos
let cachedVideos: any[] = [];
let lastScrapeTime = 0;
const CACHE_DURATION = 0; // No cache - always fetch fresh data

// Helper function to get fresh videos
async function getVideos() {
  const now = Date.now();
  if (cachedVideos.length === 0 || (now - lastScrapeTime) > CACHE_DURATION) {
    try {
      console.log('[1/3] Fetching fresh video data...');
      const scrapedVideos = await scraper.scrapeAllSources(20);
      console.log('[2/3] Transforming scraped data...');

      // Transform scraped data to match our API format
      cachedVideos = scrapedVideos.map((video, index) => ({
        id: (index + 1).toString(),
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration,
        views: video.views,
        performers: video.performers.map((performer, pIndex) => ({
          id: `${index}-${pIndex}`,
          name: performer.name,
          birthDate: new Date('1990-01-01'), // Default birth date for demo
          photoUrl: performer.photoUrl
        }))
      }));

      console.log('[3/3] Data transformed successfully.');
      lastScrapeTime = now;
    } catch (error) {
      console.error("Error fetching or processing video data:", error);
      cachedVideos = []; // Reset cache on error
    }
  }
  
  return cachedVideos;
}

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos with pagination
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of videos to skip
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of videos to return
 *     responses:
 *       200:
 *         description: A paginated list of videos
 */
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query
    let skip = parseInt(req.query.skip as string, 10);
    let take = parseInt(req.query.take as string, 10);

    // Validate and set default values
    skip = isNaN(skip) || skip < 0 ? 0 : skip;
    take = isNaN(take) || take <= 0 ? 20 : Math.min(take, 100); // Max take is 100

    const videos = await getVideos();

    // Apply pagination
    const paginatedVideos = videos.slice(skip, skip + take);

    res.json(paginatedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;