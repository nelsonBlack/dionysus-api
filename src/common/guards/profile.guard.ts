import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common"
import { Logger } from "@nestjs/common"

@Injectable()
export class ProfileGuard implements CanActivate {
  private readonly logger = new Logger(ProfileGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const profileId = request.headers["profile_id"]

    if (!profileId) {
      this.logger.error({
        message: "Missing profile_id header",
      })
      throw new UnauthorizedException("Authentication required")
    }

    // Store profileId in request for later use
    request.profileId = parseInt(profileId)
    return true
  }
}
