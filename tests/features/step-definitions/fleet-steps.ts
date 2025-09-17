import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { Fleet } from '../../../src/domain/entities/fleet';
import { VehicleAlreadyRegisteredException } from '../../../src/domain/exceptions/vehicle-already-registered.exception';
import { VehicleNotFoundException } from '../../../src/domain/exceptions/vehicle-not-found.exception';
import { Car } from '../../../src/domain/entities/vehicle';
import { Location } from '../../../src/domain/object-values/location';
import { SQLiteFleetRepository } from '../../../src/infra/repositories/sqlite-fleet.repository';
import { SQLiteFleetDatabase } from '../../../src/infra/database/fleet-database';
import { CreateFleetHandler } from '../../../src/app/handlers/create-fleet.handler';
import { RegisterVehicleHandler } from '../../../src/app/handlers/register-vehicle.handler';
import { LocalizeVehicleHandler } from '../../../src/app/handlers/localize-vehicle.handler';
import { FleetInfoHandler } from '../../../src/app/handlers/fleet-info.handler';
import { VehicleLocationHandler } from '../../../src/app/handlers/vehicle-location.handler';
import { CreateFleetCommand } from '../../../src/app/commands/create-fleet.command';
import { RegisterVehicleCommand } from '../../../src/app/commands/register-vehicle.command';
import { LocalizeVehicleCommand } from '../../../src/app/commands/localize-vehicle.command';
import { FleetInfoQuery } from '../../../src/app/queries/fleet-info.query';
import { VehicleLocationQuery } from '../../../src/app/queries/vehicle-location.query';
import { makeFleetId } from '../../../src/domain/object-values/fleet-id';
import { makeUserId } from '../../../src/domain/object-values/user-id';
import { makePlateNumber } from '../../../src/domain/object-values/plate-number';
import { FleetNotFoundException } from '../../../src/domain/exceptions/fleet-not-found.exception';

// World context to share data between steps
interface World {
  fleet?: Fleet;
  otherFleet?: Fleet;
  retrievedFleet?: Fleet;
  vehicle?: Car;
  anotherVehicle?: Car;
  location?: Location;
  retrievedLocation?: Location | undefined;
  fleetRepository?: SQLiteFleetRepository;
  createFleetHandler?: CreateFleetHandler;
  registerVehicleHandler?: RegisterVehicleHandler;
  localizeVehicleHandler?: LocalizeVehicleHandler;
  FleetInfoHandler?: FleetInfoHandler;
  VehicleLocationHandler?: VehicleLocationHandler;
  lastError?: Error;
}

let world: World = {};

// Reset world before each scenario
Given('my fleet', async function () {
  world = {};

  const fleetDatabase = new SQLiteFleetDatabase(':memory:');
  
  world.fleetRepository = new SQLiteFleetRepository(fleetDatabase);
  world.createFleetHandler = new CreateFleetHandler(world.fleetRepository);
  world.registerVehicleHandler = new RegisterVehicleHandler(world.fleetRepository);
  world.localizeVehicleHandler = new LocalizeVehicleHandler(world.fleetRepository);
  world.FleetInfoHandler = new FleetInfoHandler(world.fleetRepository);
  world.VehicleLocationHandler = new VehicleLocationHandler(world.fleetRepository);
  
  const command = new CreateFleetCommand(makeUserId('user-1'));
  const fleetId = await world.createFleetHandler.handle(command);
  
  world.fleet = (await world.fleetRepository.findOneById(fleetId))!;
});

Given('the fleet of another user', async function () {
  if (!world.createFleetHandler) {
    throw new Error('Fleet repository not initialized');
  }
  
  const command = new CreateFleetCommand(makeUserId('user-2'));
  const fleetId = await world.createFleetHandler.handle(command);
  
  world.otherFleet = (await world.fleetRepository!.findOneById(fleetId))!;
});

Given('a vehicle', function () {
  world.vehicle = new Car(makePlateNumber('ABC-123'));
});

Given('another vehicle', function () {
  world.anotherVehicle = new Car(makePlateNumber('XYZ-789'));
});

Given('I have registered this vehicle into my fleet', async function () {
  if (!world.fleet || !world.vehicle || !world.registerVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  const command = new RegisterVehicleCommand(world.fleet.id, world.vehicle.plateNumber, 'car');
  
  await world.registerVehicleHandler.handle(command);
});

Given('this vehicle has been registered into the other user\'s fleet', async function () {
  if (!world.otherFleet || !world.vehicle || !world.registerVehicleHandler) {
    throw new Error('Other fleet, vehicle, or handler not initialized');
  }
  
  const command = new RegisterVehicleCommand(world.otherFleet.id, world.vehicle.plateNumber, 'car');
  
  await world.registerVehicleHandler.handle(command);
});

When('I register this vehicle into my fleet', async function () {
  if (!world.fleet || !world.vehicle || !world.registerVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  try {
    const command = new RegisterVehicleCommand(world.fleet.id, world.vehicle.plateNumber, 'car');
    
    await world.registerVehicleHandler.handle(command);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I try to register this vehicle into my fleet', async function () {
  if (!world.fleet || !world.vehicle || !world.registerVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  try {
    const command = new RegisterVehicleCommand(world.fleet.id, world.vehicle.plateNumber, 'car');
    await world.registerVehicleHandler.handle(command);
  } catch (error) {
    world.lastError = error as Error;
  }
});

When('I park my vehicle at a given location', async function () {
  if (!world.fleet || !world.vehicle || !world.localizeVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  world.location = new Location(48.8566, 2.3522);
  
  try {
    const command = new LocalizeVehicleCommand(
      world.fleet.id,
      world.vehicle.plateNumber,
      world.location.latitude,
      world.location.longitude
    );

    await world.localizeVehicleHandler.handle(command);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I try to park this vehicle at a given location', async function () {
  if (!world.fleet || !world.anotherVehicle || !world.localizeVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  world.location = new Location(48.8566, 2.3522);
  
  try {
    const command = new LocalizeVehicleCommand(
      world.fleet.id,
      world.anotherVehicle.plateNumber,
      world.location.latitude,
      world.location.longitude
    );

    await world.localizeVehicleHandler.handle(command);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

Given('my vehicle has been parked into my fleet', async function () {
  if (!world.fleet || !world.vehicle || !world.localizeVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  world.location = new Location(48.8566, 2.3522);
  
  const command = new LocalizeVehicleCommand(
    world.fleet.id,
    world.vehicle.plateNumber,
    world.location.latitude,
    world.location.longitude
  );

  await world.localizeVehicleHandler.handle(command);
});

Given('my vehicle has been parked into my fleet with altitude', async function () {
  if (!world.fleet || !world.vehicle || !world.localizeVehicleHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  world.location = new Location(48.8566, 2.3522, 35);
  
  const command = new LocalizeVehicleCommand(
    world.fleet.id,
    world.vehicle.plateNumber,
    world.location.latitude,
    world.location.longitude,
    world.location.altitude
  );

  await world.localizeVehicleHandler.handle(command);
});

When('I get my fleet', async function () {
  if (!world.fleet || !world.FleetInfoHandler) {
    throw new Error('Fleet or handler not initialized');
  }
  
  try {
    const query = new FleetInfoQuery(world.fleet.id);

    world.retrievedFleet = await world.FleetInfoHandler.handle(query);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I try to get a fleet that doesn\'t exist', async function () {
  if (!world.FleetInfoHandler) {
    throw new Error('Handler not initialized');
  }
  
  try {
    const query = new FleetInfoQuery(makeFleetId('non-existent-fleet'));

    world.retrievedFleet = await world.FleetInfoHandler.handle(query);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I get the location of my vehicle', async function () {
  if (!world.fleet || !world.vehicle || !world.VehicleLocationHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  try {
    const query = new VehicleLocationQuery(world.fleet.id, world.vehicle.plateNumber);

    world.retrievedLocation = await world.VehicleLocationHandler.handle(query);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I try to get the location of a vehicle from a fleet that doesn\'t exist', async function () {
  if (!world.vehicle || !world.VehicleLocationHandler) {
    throw new Error('Vehicle or handler not initialized');
  }
  
  try {
    const query = new VehicleLocationQuery(makeFleetId('non-existent-fleet'), world.vehicle.plateNumber);
   
    world.retrievedLocation = await world.VehicleLocationHandler.handle(query);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

When('I try to get the location of the other vehicle', async function () {
  if (!world.fleet || !world.anotherVehicle || !world.VehicleLocationHandler) {
    throw new Error('Fleet, vehicle, or handler not initialized');
  }
  
  try {
    const query = new VehicleLocationQuery(world.fleet.id, world.anotherVehicle.plateNumber);
    
    world.retrievedLocation = await world.VehicleLocationHandler.handle(query);
  } catch (error: unknown) {
    world.lastError = error as Error;
  }
});

Then('this vehicle should be part of my vehicle fleet', async function () {
  if (!world.fleet || !world.vehicle) {
    throw new Error('Fleet or vehicle not initialized');
  }
  
  // Refresh fleet from repository
  const updatedFleet = await world.fleetRepository!.findOneById(world.fleet.id);

  assert.strictEqual(updatedFleet!.isVehicleRegistered(world.vehicle.plateNumber), true);
});

Then('I should be informed this vehicle has already been registered into my fleet', function () {
  assert.ok(world.lastError instanceof VehicleAlreadyRegisteredException);
  assert.ok(world.lastError?.message.includes('has already been registered into this fleet'));
});

Then('the known location of my vehicle should verify this location', async function () {
  if (!world.fleet || !world.vehicle || !world.location) {
    throw new Error('Fleet, vehicle, or location not initialized');
  }
  
  // Refresh fleet from repository
  const updatedFleet = await world.fleetRepository!.findOneById(world.fleet.id);
  const vehicleLocation = updatedFleet!.getVehicleLocation(world.vehicle.plateNumber);
  
  assert.ok(vehicleLocation !== undefined);
  assert.strictEqual(vehicleLocation!.latitude === world.location!.latitude, true);
  assert.strictEqual(vehicleLocation!.longitude === world.location!.longitude, true);
  assert.strictEqual(vehicleLocation!.altitude === world.location!.altitude, true);
});

Then('I should be informed that this vehicle is not part of my fleet', function () {
  assert.ok(world.lastError instanceof VehicleNotFoundException);
  assert.ok(world.lastError?.message.includes('is not registered in this fleet'));
});

// Get Fleet Then Steps
Then('I should receive my fleet information', function () {
  assert.ok(world.retrievedFleet !== undefined);
  assert.strictEqual(world.retrievedFleet!.id, world.fleet!.id);
  assert.strictEqual(world.retrievedFleet!.userId, world.fleet!.userId);
});

Then('I should be informed that the fleet was not found', function () {
  assert.ok(world.lastError instanceof FleetNotFoundException);
  assert.ok(world.lastError?.message.includes('not found'));
});

Then('the fleet should contain the registered vehicle', function () {
  assert.ok(world.retrievedFleet !== undefined);
  assert.ok(world.vehicle !== undefined);
  assert.strictEqual(world.retrievedFleet!.isVehicleRegistered(world.vehicle!.plateNumber), true);
});

Then('the vehicle should have a location', function () {
  assert.ok(world.retrievedFleet !== undefined);
  assert.ok(world.vehicle !== undefined);

  const vehicleLocation = world.retrievedFleet!.getVehicleLocation(world.vehicle!.plateNumber);
  
  assert.ok(vehicleLocation !== undefined);
});

// Get Vehicle Location Then Steps
Then('I should receive the vehicle location', function () {
  assert.ok(world.retrievedLocation !== undefined);
  assert.ok(world.location !== undefined);
  assert.strictEqual(world.retrievedLocation!.latitude === world.location!.latitude, true);
  assert.strictEqual(world.retrievedLocation!.longitude === world.location!.longitude, true);
  assert.strictEqual(world.retrievedLocation!.altitude === world.location!.altitude, true);
});

Then('I should receive no location information', function () {
  assert.strictEqual(world.retrievedLocation, undefined);
});

Then('the location should include altitude information', function () {
  assert.ok(world.retrievedLocation !== undefined);
  assert.ok(world.location !== undefined);
  assert.strictEqual(world.retrievedLocation!.altitude, world.location!.altitude);
  assert.strictEqual(world.retrievedLocation!.altitude, 35);
});
