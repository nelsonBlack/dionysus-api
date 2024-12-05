"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProfileGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileGuard = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
let ProfileGuard = ProfileGuard_1 = class ProfileGuard {
    constructor() {
        this.logger = new common_2.Logger(ProfileGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const profileId = request.headers["profile_id"];
        if (!profileId) {
            this.logger.error({
                message: "Missing profile_id header",
            });
            throw new common_1.UnauthorizedException("Authentication required");
        }
        request.profileId = parseInt(profileId);
        return true;
    }
};
exports.ProfileGuard = ProfileGuard;
exports.ProfileGuard = ProfileGuard = ProfileGuard_1 = __decorate([
    (0, common_1.Injectable)()
], ProfileGuard);
//# sourceMappingURL=profile.guard.js.map