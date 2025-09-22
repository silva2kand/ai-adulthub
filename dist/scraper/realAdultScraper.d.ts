interface RealAdultVideo {
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
    duration: number;
    views: number;
    site: string;
}
declare class RealAdultScraper {
    private userAgent;
    getWorkingAdultVideos(): Promise<RealAdultVideo[]>;
    getDirectVideoUrl(siteUrl: string): Promise<string | null>;
    scrapeFromAdultAPI(): Promise<RealAdultVideo[]>;
}
export default RealAdultScraper;
//# sourceMappingURL=realAdultScraper.d.ts.map