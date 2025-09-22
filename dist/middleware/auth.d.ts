import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default authMiddleware;
//# sourceMappingURL=auth.d.ts.map