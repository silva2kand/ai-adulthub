interface ScrapedVideo {
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    duration: number;
    views: number;
    performers: Array<{
        name: string;
        photoUrl: string;
    }>;
}
declare class VideoScraper {
    private userAgent;
    scrapeRedTubeVideos(limit?: number): Promise<ScrapedVideo[]>;
    scrapeAllSources(limit?: number): Promise<ScrapedVideo[]>;
    private cleanVideoData;
    private cleanText;
    private delay;
}
export default VideoScraper;
//# sourceMappingURL=videoScraper.d.ts.map