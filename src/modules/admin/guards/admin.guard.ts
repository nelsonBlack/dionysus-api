import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common"
import { Profile } from "../../profiles/models/profile.model"

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const profileId = request.get("profile_id")

    if (!profileId) {
      throw new UnauthorizedException("Profile ID is required")
    }

    // Get profile from database
    const profile = await Profile.findOne({ where: { id: profileId } })

    if (!profile) {
      throw new UnauthorizedException("Profile not found")
    }

    // Store profile in request
    request.profile = profile

    return true
  }
}
