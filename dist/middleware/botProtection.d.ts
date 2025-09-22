import { Request, Response, NextFunction } from 'express';
/**
 * Advanced bot detection middleware
 */
export declare const botProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const videoStreamLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const searchLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare class IPReputationTracker {
    private suspiciousIPs;
    private blockedIPs;
    /**
     * Mark IP as suspicious
     */
    markSuspicious(ip: string, reason: string): void;
    /**
     * Block IP completely
     */
    blockIP(ip: string): void;
    /**
     * Check if IP is blocked
     */
    isBlocked(ip: string): Promise<boolean>;
}
export declare const ipReputationTracker: IPReputationTracker;
/**
 * IP reputation middleware
 */
export declare const ipReputationCheck: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Comprehensive security middleware stack
 */
export declare const securityStack: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>))[];
declare const _default: {
    botProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
    authLimiter: import("express-rate-limit").RateLimitRequestHandler;
    videoStreamLimiter: import("express-rate-limit").RateLimitRequestHandler;
    searchLimiter: import("express-rate-limit").RateLimitRequestHandler;
    ipReputationCheck: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    securityStack: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>))[];
    ipReputationTracker: IPReputationTracker;
};
export default _default;
//# sourceMappingURL=botProtection.d.ts.map