import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
// Note: Using memory store for now, Redis store can be added later
import redis from '../config/redis';
import logger from '../utils/logger';

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
const isBot = (userAgent: string): boolean => {
  if (!userAgent) return true; // No user agent = suspicious
  
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
};

/**
 * Check for suspicious request content
 */
const hasSuspiciousContent = (req: Request): boolean => {
  const checkString = (str: string): boolean => {
    return Object.values(SUSPICIOUS_PATTERNS).some(pattern => pattern.test(str));
  };
  
  // Check URL
  if (checkString(req.url)) return true;
  
  // Check query parameters
  for (const value of Object.values(req.query)) {
    if (typeof value === 'string' && checkString(value)) return true;
  }
  
  // Check request body
  if (req.body && typeof req.body === 'object') {
    for (const value of Object.values(req.body)) {
      if (typeof value === 'string' && checkString(value)) return true;
    }
  }
  
  return false;
};

/**
 * Advanced bot detection middleware
 */
export const botProtection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  // Check if request is from a bot
  if (isBot(userAgent)) {
    logger.warn('Bot blocked', {
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
    logger.warn('Suspicious request blocked', {
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

/**
 * Create rate limiter with Redis store
 */
const createRateLimiter = (
  windowMs: number,
  max: number,
  keyGenerator?: (req: Request) => string,
  skipSuccessfulRequests = false
) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || ((req) => req.ip || 'unknown'),
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
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
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests per window per IP
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  (req) => `${req.ip || 'unknown'}:${req.body?.email || 'unknown'}` // Key by IP + email
);

export const videoStreamLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 video requests per minute
  (req) => req.ip || 'unknown',
  true // Don't count successful requests
);

export const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30 // 30 searches per minute
);

// IP reputation tracking
class IPReputationTracker {
  private suspiciousIPs = new Map<string, number>();
  private blockedIPs = new Set<string>();
  
  /**
   * Mark IP as suspicious
   */
  markSuspicious(ip: string, reason: string) {
    const current = this.suspiciousIPs.get(ip) || 0;
    const newScore = current + 1;
    
    this.suspiciousIPs.set(ip, newScore);
    
    logger.warn('IP marked as suspicious', { ip, reason, score: newScore });
    
    // Block IP if score is too high
    if (newScore >= 5) {
      this.blockIP(ip);
    }
  }
  
  /**
   * Block IP completely
   */
  blockIP(ip: string) {
    this.blockedIPs.add(ip);
    logger.error('IP blocked', { ip });
    
    // Store in Redis with expiry
    redis.setEx(`blocked:${ip}`, 24 * 60 * 60, '1'); // Block for 24 hours
  }
  
  /**
   * Check if IP is blocked
   */
  async isBlocked(ip: string): Promise<boolean> {
    // Check local cache first
    if (this.blockedIPs.has(ip)) return true;
    
    // Check Redis
    const blocked = await redis.get(`blocked:${ip}`);
    return !!blocked;
  }
}

export const ipReputationTracker = new IPReputationTracker();

/**
 * IP reputation middleware
 */
export const ipReputationCheck = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || '';
  
  if (await ipReputationTracker.isBlocked(ip)) {
    logger.warn('Blocked IP attempted access', { ip, url: req.url });
    
    return res.status(403).json({
      error: 'Access denied: IP blocked due to suspicious activity'
    });
  }
  
  next();
};

/**
 * Comprehensive security middleware stack
 */
export const securityStack = [
  ipReputationCheck,
  botProtection,
  apiLimiter
];

export default {
  botProtection,
  apiLimiter,
  authLimiter,
  videoStreamLimiter,
  searchLimiter,
  ipReputationCheck,
  securityStack,
  ipReputationTracker
};