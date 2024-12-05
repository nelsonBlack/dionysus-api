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
var ContractsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const contract_model_1 = require("../models/contract.model");
let ContractsService = ContractsService_1 = class ContractsService {
    constructor(contractModel) {
        this.contractModel = contractModel;
        this.logger = new common_1.Logger(ContractsService_1.name);
    }
    async findOne(id) {
        this.logger.debug({
            message: "Finding contract",
            contractId: id,
        });
        const contract = await this.contractModel.findByPk(id);
        if (!contract) {
            this.logger.error({
                message: "Contract not found",
                contractId: id,
            });
            throw new common_1.NotFoundException(`Contract with ID ${id} not found`);
        }
        return contract;
    }
    async findAll(profileId) {
        this.logger.debug({
            message: "Finding non-terminated contracts",
            profileId,
        });
        return this.contractModel.findAll({
            where: {
                [sequelize_2.Op.and]: [
                    {
                        [sequelize_2.Op.or]: [
                            { ClientId: profileId },
                            { ContractorId: profileId }
                        ]
                    },
                    {
                        status: {
                            [sequelize_2.Op.ne]: "terminated"
                        }
                    }
                ]
            }
        });
    }
    async findById(id) {
        return this.contractModel.findByPk(id);
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = ContractsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(contract_model_1.Contract)),
    __metadata("design:paramtypes", [Object])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map