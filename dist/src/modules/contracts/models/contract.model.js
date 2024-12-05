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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const job_model_1 = require("../../jobs/models/job.model");
const profile_model_1 = require("./profile.model");
let Contract = class Contract extends sequelize_typescript_1.Model {
};
exports.Contract = Contract;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Contract.prototype, "terms", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM("new", "in_progress", "terminated"),
    }),
    __metadata("design:type", String)
], Contract.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => profile_model_1.Profile),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Contract.prototype, "ContractorId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => profile_model_1.Profile),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Contract.prototype, "ClientId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => profile_model_1.Profile, "ContractorId"),
    __metadata("design:type", profile_model_1.Profile)
], Contract.prototype, "contractor", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => profile_model_1.Profile, "ClientId"),
    __metadata("design:type", profile_model_1.Profile)
], Contract.prototype, "client", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => job_model_1.Job),
    __metadata("design:type", Array)
], Contract.prototype, "jobs", void 0);
exports.Contract = Contract = __decorate([
    sequelize_typescript_1.Table
], Contract);
//# sourceMappingURL=contract.model.js.map