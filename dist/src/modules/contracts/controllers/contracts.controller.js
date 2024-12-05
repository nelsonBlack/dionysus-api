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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContractsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_service_1 = require("../services/contracts.service");
const profile_guard_1 = require("../../../common/guards/profile.guard");
const contract_ownership_guard_1 = require("../../../common/guards/contract-ownership.guard");
let ContractsController = ContractsController_1 = class ContractsController {
    constructor(contractsService) {
        this.contractsService = contractsService;
        this.logger = new common_1.Logger(ContractsController_1.name);
    }
    async getContract(id) {
        const contract = await this.contractsService.findById(id);
        if (!contract) {
            this.logger.error({
                message: "Contract not found",
                contractId: id,
            });
            throw new common_1.NotFoundException(`Contract with ID ${id} not found`);
        }
        return {
            status: "success",
            data: contract
        };
    }
    async getContracts() {
        this.logger.debug({
            message: "Get all contracts request",
        });
        const profileId = 1;
        return this.contractsService.findAll(profileId);
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(profile_guard_1.ProfileGuard, contract_ownership_guard_1.ContractOwnershipGuard),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getContract", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getContracts", null);
exports.ContractsController = ContractsController = ContractsController_1 = __decorate([
    (0, common_1.Controller)("contracts"),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map