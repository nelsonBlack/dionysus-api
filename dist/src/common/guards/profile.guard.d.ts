import { CanActivate, ExecutionContext } from "@nestjs/common";
export declare class ProfileGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
