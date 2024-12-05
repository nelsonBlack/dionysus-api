"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ContractOwnershipGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractOwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const contracts_service_1 = require("../services/contracts.service");
let ContractOwnershipGuard = ContractOwnershipGuard_1 = class ContractOwnershipGuard {
    constructor(contractsService) {
        this.contractsService = contractsService;
        this.logger = new common_2.Logger(ContractOwnershipGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const contractId = parseInt(request.params.id);
        const profileId = parseInt(request.headers["profile_id"]);
        const contract = await this.contractsService.findById(contractId);
        if (!contract) {
            throw new common_1.NotFoundException(`Contract with ID ${contractId} not found`);
        }
        const canView = contract.ClientId === profileId || contract.ContractorId === profileId;
        if (!canView) {
            this.logger.error({
                message: "Unauthorized access to contract",
                contractId,
                profileId,
            });
            throw new common_1.NotFoundException(`Contract with ID ${contractId} not found`);
        }
        return true;
    }
};
exports.ContractOwnershipGuard = ContractOwnershipGuard;
exports.ContractOwnershipGuard = ContractOwnershipGuard = ContractOwnershipGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractOwnershipGuard);
//# sourceMappingURL=contract-ownership.guard.js.map