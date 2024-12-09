import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common"
import { Profile } from "../../modules/profiles/models/profile.model"

@Injectable()
export class ProfileGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const profileId = request.get("profile_id")

    if (!profileId) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Profile ID is required",
        error: "Unauthorized",
      })
    }

    const profile = await Profile.findOne({ where: { id: profileId } })

    if (!profile) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Profile not found",
        error: "Unauthorized",
      })
    }

    request.profile = profile
    return true
  }
}
