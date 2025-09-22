"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Adult content streaming URLs (working video content)
const adultStreamingUrls = {
    '1': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '2': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '3': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '4': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    '5': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    '6': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    '7': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    '8': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
};
// Enhanced adult content URLs (these would be real adult content in production)
const realAdultContent = {
    '1': {
        url: 'https://cdn.spankbang.com/12345/480p/spankbang_passionate_couple_480p.mp4',
        fallback: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
    },
    '2': {
        url: 'https://ev-h.phncdn.com/hls/videos/202301/15/123456789/720P_4000K_123456789.mp4/master.m3u8',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
    },
    '3': {
        url: 'https://cdn.xvideos-cdn.com/12345678/video.mp4',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1920x1080_1mb.mp4'
    },
    '4': {
        url: 'https://cdn.redtube.com/media/12345/720P_4000K_12345.mp4',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4'
    },
    '5': {
        url: 'https://youporn.com/embed/16789012/720/',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4'
    },
    '6': {
        url: 'https://tube8.com/embed/87654321',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
    },
    '7': {
        url: 'https://www.porn.com/videos/embed/lesbian-action-123456',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1920x1080_2mb.mp4'
    },
    '8': {
        url: 'https://beeg.com/api/v6/video/12345678',
        fallback: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_2mb.mp4'
    }
};
/**
 * @swagger
 * /api/stream/{id}:
 *   get:
 *     summary: Stream adult video content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Adult video stream
 *       404:
 *         description: Video not found
 */
router.get('/:id', async (req, res) => {
    const videoId = req.params.id;
    try {
        const streamUrl = adultStreamingUrls[videoId];
        if (!streamUrl) {
            return res.status(404).json({ error: 'Video not found' });
        }
        console.log(`Streaming video ${videoId}: ${streamUrl}`);
        // Simple redirect to the actual video file
        return res.redirect(streamUrl);
    }
    catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ error: 'Streaming error' });
    }
});
/**
 * @swagger
 * /api/stream/embed/{id}:
 *   get:
 *     summary: Get embeddable adult video player
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML embed player
 */
router.get('/embed/:id', async (req, res) => {
    const videoId = req.params.id;
    const streamUrl = `http://localhost:4000/api/stream/${videoId}`;
    const embedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Adult Video Player</title>
      <style>
        body { margin: 0; padding: 0; background: #000; }
        video { width: 100%; height: 100vh; object-fit: contain; }
        .overlay { 
          position: absolute; top: 20px; left: 20px; right: 20px;
          background: rgba(220, 20, 60, 0.9); color: white; 
          padding: 15px; border-radius: 5px; text-align: center;
          font-family: Arial, sans-serif; z-index: 100;
        }
      </style>
    </head>
    <body>
      <div class="overlay">
        <h3>🔞 ADULT CONTENT - Video ${videoId} 🔞</h3>
        <p>Premium adult streaming in progress...</p>
      </div>
      <video controls autoplay>
        <source src="${streamUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </body>
    </html>
  `;
    res.setHeader('Content-Type', 'text/html');
    res.send(embedHTML);
});
exports.default = router;
//# sourceMappingURL=stream.js.map