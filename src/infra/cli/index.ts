#!/usr/bin/env tsx

import { Command } from 'commander';
import packageJson from '../../../package.json';
import { CreateFleetCommand } from '../../app/commands/create-fleet.command';
import { LocalizeVehicleCommand } from '../../app/commands/localize-vehicle.command';
import { RegisterVehicleCommand } from '../../app/commands/register-vehicle.command';
import { CreateFleetHandler } from '../../app/handlers/create-fleet.handler';
import { FleetInfoHandler } from '../../app/handlers/fleet-info.handler';
import { LocalizeVehicleHandler } from '../../app/handlers/localize-vehicle.handler';
import { RegisterVehicleHandler } from '../../app/handlers/register-vehicle.handler';
import { VehicleLocationHandler } from '../../app/handlers/vehicle-location.handler';
import { FleetInfoQuery } from '../../app/queries/fleet-info.query';
import { VehicleLocationQuery } from '../../app/queries/vehicle-location.query';
import { makeFleetId } from '../../domain/object-values/fleet-id';
import { makePlateNumber } from '../../domain/object-values/plate-number';
import { makeUserId } from '../../domain/object-values/user-id';
import { config } from '../config/env';
import { SQLiteFleetDatabase } from '../database/fleet-database';
import { SQLiteFleetRepository } from '../repositories/sqlite-fleet.repository';

const program = new Command();
const fleetDatabase = new SQLiteFleetDatabase(config.dbPath);
const fleetRepository = new SQLiteFleetRepository(fleetDatabase);

program.name('fleet').description('Fleet management CLI').version(packageJson.version);

program
  .command('create')
  .description('Create a new fleet')
  .argument('<userId>', 'User ID who owns the fleet')
  .action(async (userId: string) => {
    try {
      const handler = new CreateFleetHandler(fleetRepository);
      const command = new CreateFleetCommand(makeUserId(userId));
      const fleetId = await handler.handle(command);

      console.log(fleetId);
    } catch (error: unknown) {
      console.error('Error:', error instanceof Error ? error.message : error);

      process.exit(1);
    }
  });

program
  .command('register-vehicle')
  .description('Register a vehicle into a fleet')
  .argument('<fleetId>', 'Fleet ID')
  .argument('<plateNumber>', 'Vehicle plate number')
  .argument('<vehicleType>', 'Vehicle type (car, truck, motorcycle)')
  .action(async (fleetId: string, plateNumber: string, vehicleType: string) => {
    try {
      const handler = new RegisterVehicleHandler(fleetRepository);
      const command = new RegisterVehicleCommand(
        makeFleetId(fleetId),
        makePlateNumber(plateNumber),
        vehicleType as 'car' | 'truck' | 'motorcycle'
      );
      await handler.handle(command);

      console.log(`Vehicle ${plateNumber} registered successfully to fleet ${fleetId}`);
    } catch (error: unknown) {
      console.error('Error:', (error as Error).message);

      process.exit(1);
    }
  });

program
  .command('localize-vehicle')
  .description('Set the location of a vehicle')
  .argument('<fleetId>', 'Fleet ID')
  .argument('<PlateNumber>', 'Vehicle plate number')
  .argument('<lat>', 'Latitude', Number.parseFloat)
  .argument('<lng>', 'Longitude', Number.parseFloat)
  .argument('[altitude]', 'Altitude (optional)', Number.parseFloat)
  .action(
    async (fleetId: string, PlateNumber: string, lat: number, lng: number, altitude?: number) => {
      try {
        const handler = new LocalizeVehicleHandler(fleetRepository);
        const command = new LocalizeVehicleCommand(
          makeFleetId(fleetId),
          makePlateNumber(PlateNumber),
          lat,
          lng,
          altitude
        );

        await handler.handle(command);

        console.log(
          `Vehicle ${PlateNumber} localized at ${lat}, ${lng}${altitude !== undefined ? `, altitude: ${altitude}` : ''}`
        );
      } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error);

        process.exit(1);
      }
    }
  );

program
  .command('info')
  .description('Get fleet information by ID')
  .argument('<fleetId>', 'Fleet ID')
  .action(async (fleetId: string) => {
    try {
      const handler = new FleetInfoHandler(fleetRepository);
      const query = new FleetInfoQuery(makeFleetId(fleetId));
      const fleet = await handler.handle(query);

      console.log(`Fleet ID: ${fleet.id}`);
      console.log(`User ID: ${fleet.userId}`);
      console.log(`Vehicle Count: ${fleet.getVehicleCount()}`);

      const vehicles = fleet.getRegisteredVehicles();

      if (vehicles.length > 0) {
        console.log('Registered Vehicles:');

        for (const vehicle of vehicles) {
          const location = fleet.getVehicleLocation(vehicle.plateNumber);
          const locationText = location
            ? ` (Location: ${location.latitude}, ${location.longitude}${location.altitude ? `, ${location.altitude}m` : ''})`
            : ' (No location)';

          console.log(`  - ${vehicle.plateNumber} (${vehicle.type})${locationText}`);
        }
      }
    } catch (error: unknown) {
      console.error('Error:', error instanceof Error ? error.message : error);

      process.exit(1);
    }
  });

program
  .command('locate')
  .description('Get the location of a vehicle in a fleet')
  .argument('<fleetId>', 'Fleet ID')
  .argument('<PlateNumber>', 'Vehicle plate number')
  .action(async (fleetId: string, PlateNumber: string) => {
    try {
      const handler = new VehicleLocationHandler(fleetRepository);
      const query = new VehicleLocationQuery(makeFleetId(fleetId), makePlateNumber(PlateNumber));
      const location = await handler.handle(query);

      if (location) {
        console.log(`Vehicle ${PlateNumber} is located at:`);
        console.log(`  Latitude: ${location.latitude}`);
        console.log(`  Longitude: ${location.longitude}`);

        if (location.altitude !== undefined) {
          console.log(`  Altitude: ${location.altitude}m`);
        }
      } else {
        console.log(`Vehicle ${PlateNumber} has no recorded location`);
      }
    } catch (error: unknown) {
      console.error('Error:', error instanceof Error ? error.message : error);

      process.exit(1);
    }
  });

program.parse();
