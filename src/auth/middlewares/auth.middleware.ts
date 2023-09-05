import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}
  async use(req: any, res: any, next: () => void) {
    const token = req.cookies['token'];
    if (!token) {
      throw new UnauthorizedException('token is required for this request');
    }
    const decodedToken = await this.authService.decodeToken(token);
    req.user = decodedToken;
    next();
  }
}
