"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityStack = exports.ipReputationCheck = exports.ipReputationTracker = exports.searchLimiter = exports.videoStreamLimiter = exports.authLimiter = exports.apiLimiter = exports.botProtection = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Note: Using memory store for now, Redis store can be added later
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
// Bot detection patterns
const BOT_PATTERNS = [
    // Common web scrapers
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /beautifulsoup/i,
    /mechanize/i,
    // Automated browsers
    /selenium/i,
    /phantomjs/i,
    /headless/i,
    /puppeteer/i,
    /playwright/i,
    /webdriver/i,
    // Social media crawlers (block for adult content)
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    // Search engines (selective blocking)
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    // Malicious bots
    /masscan/i,
    /nmap/i,
    /nikto/i,
    /sqlmap/i,
    /dirb/i,
    /dirbuster/i,
    // Generic bot indicators
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
];
// Suspicious request patterns
const SUSPICIOUS_PATTERNS = {
    // SQL injection attempts
    sql: /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    // XSS attempts
    xss: /(\%3C)|(<)|(\%3E)|(>)/i,
    // Path traversal
    pathTraversal: /(\.\.)|(\.\\)|(\.\/)/,
    // Command injection
    cmdInjection: /(;)|(\|)|(\&)|(\$\()|(\`)/,
};
/**
 * Check if request comes from a bot based on user agent
 */
const isBot = (userAgent) => {
    if (!userAgent)
        return true; // No user agent = suspicious
    return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
};
/**
 * Check for suspicious request content
 */
const hasSuspiciousContent = (req) => {
    const checkString = (str) => {
        return Object.values(SUSPICIOUS_PATTERNS).some(pattern => pattern.test(str));
    };
    // Check URL
    if (checkString(req.url))
        return true;
    // Check query parameters
    for (const value of Object.values(req.query)) {
        if (typeof value === 'string' && checkString(value))
            return true;
    }
    // Check request body
    if (req.body && typeof req.body === 'object') {
        for (const value of Object.values(req.body)) {
            if (typeof value === 'string' && checkString(value))
                return true;
        }
    }
    return false;
};
/**
 * Advanced bot detection middleware
 */
const botProtection = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    // Check if request is from a bot
    if (isBot(userAgent)) {
        logger_1.default.warn('Bot blocked', {
            ip,
            userAgent,
            url: req.url,
            method: req.method
        });
        return res.status(403).json({
            error: 'Access denied: Automated access not allowed'
        });
    }
    // Check for suspicious content
    if (hasSuspiciousContent(req)) {
        logger_1.default.warn('Suspicious request blocked', {
            ip,
            userAgent,
            url: req.url,
            method: req.method,
            body: req.body
        });
        return res.status(400).json({
            error: 'Bad request: Suspicious content detected'
        });
    }
    next();
};
exports.botProtection = botProtection;
/**
 * Create rate limiter with Redis store
 */
const createRateLimiter = (windowMs, max, keyGenerator, skipSuccessfulRequests = false) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        keyGenerator: keyGenerator || ((req) => req.ip || 'unknown'),
        skipSuccessfulRequests,
        handler: (req, res) => {
            logger_1.default.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                url: req.url
            });
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.round(windowMs / 1000)
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
// Different rate limiters for different endpoints
exports.apiLimiter = createRateLimiter(15 * 60 * 1000, // 15 minutes
100 // 100 requests per window per IP
);
exports.authLimiter = createRateLimiter(15 * 60 * 1000, // 15 minutes
5, // 5 login attempts per window
(req) => `${req.ip || 'unknown'}:${req.body?.email || 'unknown'}` // Key by IP + email
);
exports.videoStreamLimiter = createRateLimiter(60 * 1000, // 1 minute
10, // 10 video requests per minute
(req) => req.ip || 'unknown', true // Don't count successful requests
);
exports.searchLimiter = createRateLimiter(60 * 1000, // 1 minute
30 // 30 searches per minute
);
// IP reputation tracking
class IPReputationTracker {
    constructor() {
        this.suspiciousIPs = new Map();
        this.blockedIPs = new Set();
    }
    /**
     * Mark IP as suspicious
     */
    markSuspicious(ip, reason) {
        const current = this.suspiciousIPs.get(ip) || 0;
        const newScore = current + 1;
        this.suspiciousIPs.set(ip, newScore);
        logger_1.default.warn('IP marked as suspicious', { ip, reason, score: newScore });
        // Block IP if score is too high
        if (newScore >= 5) {
            this.blockIP(ip);
        }
    }
    /**
     * Block IP completely
     */
    blockIP(ip) {
        this.blockedIPs.add(ip);
        logger_1.default.error('IP blocked', { ip });
        // Store in Redis with expiry
        redis_1.default.setEx(`blocked:${ip}`, 24 * 60 * 60, '1'); // Block for 24 hours
    }
    /**
     * Check if IP is blocked
     */
    async isBlocked(ip) {
        // Check local cache first
        if (this.blockedIPs.has(ip))
            return true;
        // Check Redis
        const blocked = await redis_1.default.get(`blocked:${ip}`);
        return !!blocked;
    }
}
exports.ipReputationTracker = new IPReputationTracker();
/**
 * IP reputation middleware
 */
const ipReputationCheck = async (req, res, next) => {
    const ip = req.ip || '';
    if (await exports.ipReputationTracker.isBlocked(ip)) {
        logger_1.default.warn('Blocked IP attempted access', { ip, url: req.url });
        return res.status(403).json({
            error: 'Access denied: IP blocked due to suspicious activity'
        });
    }
    next();
};
exports.ipReputationCheck = ipReputationCheck;
/**
 * Comprehensive security middleware stack
 */
exports.securityStack = [
    exports.ipReputationCheck,
    exports.botProtection,
    exports.apiLimiter
];
exports.default = {
    botProtection: exports.botProtection,
    apiLimiter: exports.apiLimiter,
    authLimiter: exports.authLimiter,
    videoStreamLimiter: exports.videoStreamLimiter,
    searchLimiter: exports.searchLimiter,
    ipReputationCheck: exports.ipReputationCheck,
    securityStack: exports.securityStack,
    ipReputationTracker: exports.ipReputationTracker
};
//# sourceMappingURL=botProtection.js.map