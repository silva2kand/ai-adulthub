"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoScraper_1 = __importDefault(require("../scraper/videoScraper"));
const router = (0, express_1.Router)();
const scraper = new videoScraper_1.default();
// Cache for scraped videos
let cachedVideos = [];
let lastScrapeTime = 0;
const CACHE_DURATION = 0; // No cache - always fetch fresh data
// Helper function to get fresh videos
async function getVideos() {
    const now = Date.now();
    if (cachedVideos.length === 0 || (now - lastScrapeTime) > CACHE_DURATION) {
        console.log('Fetching fresh video data...');
        const scrapedVideos = await scraper.scrapeAllSources(20);
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
        lastScrapeTime = now;
    }
    return cachedVideos;
}
/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get('/', async (req, res) => {
    try {
        const videos = await getVideos();
        res.json(videos);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map