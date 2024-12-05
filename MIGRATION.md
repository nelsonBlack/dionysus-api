# Migration from Express to NestJS

## Original Structure (Express)

````src/
├── app.js # Express application setup
├── middleware/
│ ├── getProfile.js # Profile middleware
│ └── parseId.js # ID parsing middleware
├── services/
│ └── contracts.js # Contract service logic
└── tests/
└── unit/
└── contracts.test.js```

## New Structure (NestJS)

```src/
├── main.ts # NestJS application entry
├── app.module.ts # Root module
├── modules/
│ └── contracts/
│ ├── contracts.module.ts # Module definition
│ ├── controllers/
│ │ ├── contracts.controller.ts
│ │ ├── contracts.controller.spec.ts
│ │ └── contracts.controller.integration.spec.ts
│ ├── services/
│ │ ├── contracts.service.ts
│ │ └── contracts.service.spec.ts
│ ├── entities/
│ │ └── contract.entity.ts
│ └── dto/
│ └── contract.dto.ts
└── common/
└── guards/
└── profile.guard.ts```

## Code Migration Examples

Original Express Code (app.js):

```js
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');

app.get('/contracts/:id', getProfile, async (req, res) => {
const { Contract } = req.app.get('models');
const { id } = req.params;
const contract = await Contract.findOne({ where: { id } });
if (!contract) return res.status(404).end();
res.json(contract);
});
````

New NestJS Code (contracts.controller.ts):

```ts
@Controller('contracts')
export class ContractsController {
constructor(private readonly contractsService: ContractsService) {}

@Get(':id')
@UseGuards(ProfileGuard)
async getContract(@Param('id') id: number, @Profile() profile: ProfileDto): Promise<ApiResponse<Contract>> {
const contract = await this.contractsService.findById(id, profile);
if (!contract) {
throw new NotFoundException('Contract not found');
}
return { status: 'success', data: contract };
}
}
```

## Key Improvements

1. Type Safety

   - Added TypeScript support
   - Strict type checking
   - Interface definitions

2. Architecture

   - Modular structure
   - Separation of concerns
   - Dependency injection

3. Error Handling

   - Consistent error responses
   - Built-in exception filters
   - Proper HTTP status codes

4. Authentication

   - Guard-based authentication
   - Custom decorators
   - Profile validation

5. Testing
   - Unit tests
   - Integration tests
   - E2E testing support

## Benefits

1. Better code organization
2. Type safety
3. Improved error handling
4. Easier testing
5. Better maintainability
6. Scalable architecture
7. Built-in dependency injection
8. OpenAPI documentation
9. Better developer experience
10. Modern development practices
