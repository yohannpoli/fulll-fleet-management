# Fleet Management

A TypeScript-based fleet management implementing Domain-Driven Design (DDD), CQRS, and Clean Architecture patterns.

## Overview

### Features

The system supports the following fleet management operations:

1. **Fleet Creation**: Create a new fleet for a user
2. **Vehicle Registration**: Register vehicles to a fleet with type specification (car, truck, motorcycle) - prevents duplicate registration within same fleet
3. **Vehicle Localization**: Set GPS coordinates for vehicles in a fleet
4. **Fleet Information Retrieval**: Get detailed fleet information including registered vehicles and their locations
5. **Vehicle Location Queries**: Retrieve the current location of specific vehicles in a fleet

### Domain Models

- **Vehicle**: Abstract base class for transportation modes (Car, Truck, Motorcycle)
- **Fleet**: A collection of distinct vehicles belonging to a user
- **Location**: GPS coordinates with optional altitude for vehicle positioning

### Business Rules

1. **Vehicle Registration**: 
   - A vehicle cannot be registered twice in the same fleet
   - The same vehicle can belong to multiple different fleets

2. **Vehicle Localization**:
   - Only registered vehicles can be localized
   - Coordinates must be valid GPS coordinates (lat: -90 to 90, lng: -180 to 180)

3. **Fleet Management**:
   - Each fleet belongs to a specific user
   - Fleet IDs are automatically generated UUIDs

## Getting Started

### Installation
```bash
npm clean-install
```

### Usage

The system provides a command-line interface for fleet operations:

#### Available Commands

| Command | Description |
|---------|-------------|
| `npx fleet create <userId>` | Create a new fleet for a user |
| `npx fleet register-vehicle <fleetId> <PlateNumber> <vehicleType>` | Register a vehicle to a fleet |
| `npx fleet localize-vehicle <fleetId> <PlateNumber> <lat> <lng> [alt]` | Set GPS coordinates for a vehicle |
| `npx fleet info <fleetId>` | Get fleet information and registered vehicles |
| `npx fleet locate <fleetId> <PlateNumber>` | Get the current location of a vehicle |

#### Example

```bash
# 1. Create a fleet for user "john"
npx fleet create john
# Output: 550e8400-e29b-41d4-a716-446655440000

# 2. Register a vehicle to the fleet
npx fleet register-vehicle 550e8400-e29b-41d4-a716-446655440000 ABC-123 car
# Output: Vehicle ABC-123 registered successfully to fleet 550e8400-e29b-41d4-a716-446655440000

# 3. Set vehicle location (Paris coordinates)
npx fleet localize-vehicle 550e8400-e29b-41d4-a716-446655440000 ABC-123 48.8566 2.3522
# Output: Vehicle ABC-123 localized at 48.8566, 2.3522

# 4. Get fleet information
npx fleet info 550e8400-e29b-41d4-a716-446655440000
# Output:
# Fleet ID: 550e8400-e29b-41d4-a716-446655440000
# User ID: john
# Vehicle Count: 1
# Registered Vehicles:
#   - ABC-123 (car) (Location: 48.8566, 2.3522)

# 5. Get specific vehicle location
npx fleet locate 550e8400-e29b-41d4-a716-446655440000 ABC-123
# Output:
# Vehicle ABC-123 is located at:
#   Latitude: 48.8566
#   Longitude: 2.3522
```

**Note**: For negative arguments value, use `--` before the value:
```bash
npx fleet localize-vehicle <fleetId> <PlateNumber> 40.7128 -- -74.006
npx fleet localize-vehicle <fleetId> <PlateNumber> 40.7128 -- -74.006 -- -50
```

## Development

### Testing

The project includes comprehensive testing at multiple levels with a well-organized test structure:

#### Test Structure
```
src/
└── **/__tests__/       # Jest unit tests alongside source code
tests/
├── features/           # Cucumber BDD feature files and step definitions
└── integration/        # Jest integration tests
```

#### Test Types
- **Unit Tests (Jest)**: Fast isolated tests for domain models, business logic validation, and error handling
- **Feature Tests (Cucumber BDD)**: Business-readable scenario testing with Gherkin syntax
- **Integration Tests (Jest)**: End-to-end CLI testing with real database interactions

#### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run feature tests only
npm run test:feature
```

#### Coverage

```bash
# Run unit tests with coverage
npm run coverage:unit
```

### Code Quality

```bash
# Check linting and formatting
npm run check

# Auto-fix linting and formatting issues
npm run check:fix
```

### Circular Dependencies

```bash
# Check for circular dependencies
npm run circular
```

## Architecture

### Clean Architecture Structure

```
./src/
├── app/              # Application layer - commands, queries and handlers
│   ├── commands/     # Write operations (create, register, localize)
│   ├── queries/      # Read operations (get fleet, get location)
│   └── handlers/     # Use case handlers implementing business logic
├── domain/           # Domain layer - models, entities and value objects
│   └── repositories/ # Repository interfaces
└── infra/            # Infrastructure layer - external concerns
    ├── cli/          # Command-line interface
    ├── database/     # Database implementations
    └── repositories/ # Repository implementations
```

### Technical Stack

- **TypeScript**: Type-safe JavaScript development
- **Node.js**: Runtime environment
- **Commander.js**: CLI framework
- **Jest**: Unit testing framework
- **Biome**: Code quality tool
- **Cucumber**: BDD testing framework
- **SQLite**: Embedded database for data persistence
- **UUID**: Unique identifier generation

## Next Steps

This CLI is a starting point, but there are several ways to take it further:

### 1. Infrastructure Improvements
- Replace the database layer with a more robust solution (e.g., TypeORM, Sequelize, Prisma).
- Add a database docker container (MongoDB, PostgreSQL, etc.).
- Add database migration system.
- Add database backup system.
- Add database restore system.
- Add better config system (e.g., dotenv, config, etc.) for ENV variables.
- Add REST API.
- ...

### 2. Domain Improvements
- Add more domain logic (like equals to compare domain models).
- ...

### 3. Code quality
- Add Effect-TS (Schema, Brand, Result, etc.)
- Add TypeScript Aliases
- ... 

### 4. CI/CD
- Add GitHub Actions
- ...


