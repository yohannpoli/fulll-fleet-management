import { spawn } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { config } from '../../src/infra/config/env';

const execAsync = promisify(require('child_process').exec);

async function deleteDatabase(testDbPath: string) {
  try {
    await unlink(testDbPath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

describe('Fleet CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../../src/infra/cli/index.ts');
  const testDbPath = join(__dirname, '../..', 'data/fleets.integration.db');
  let testFleetId: string;

  beforeAll(async () => {
    await deleteDatabase(testDbPath);
  });

  afterAll(async () => {
    await deleteDatabase(testDbPath);
  });

  const runCLI = async (args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve) => {
      const child = spawn('npx', ['tsx', cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: join(__dirname, '../..'),
        timeout: 10000, // 10 second timeout
        env: { ...process.env, DB_PATH: testDbPath }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout: '',
          stderr: error.message,
          exitCode: 1
        });
      });
    });
  };

  const createTestFleet = async (): Promise<string> => {
    const result = await runCLI(['create', `test-user-${Date.now()}`]);

    if (result.exitCode !== 0) {
      throw new Error(`Failed to create test fleet: ${result.stderr}`);
    }

    return result.stdout;
  };

  describe('Version Command', () => {
    it('should display version from package.json', async () => {
      const result = await runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Help Command', () => {
    it('should display help information', async () => {
      const result = await runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Fleet management CLI');
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('register-vehicle');
      expect(result.stdout).toContain('localize-vehicle');
      expect(result.stdout).toContain('info');
      expect(result.stdout).toContain('locate');
    });
  });

  describe('Fleet Management Workflow', () => {
    beforeAll(async () => {
      testFleetId = await createTestFleet();
    });

    it('should create a fleet successfully', async () => {
      const result = await runCLI(['create', 'test-user']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should register vehicles to the fleet', async () => {
      const result1 = await runCLI(['register-vehicle', testFleetId, 'ABC-123', 'car']);
      
      expect(result1.exitCode).toBe(0);
      expect(result1.stdout).toContain('Vehicle ABC-123 registered successfully');

      const result2 = await runCLI(['register-vehicle', testFleetId, 'DEF-456', 'truck']);
      
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain('Vehicle DEF-456 registered successfully');

      const result3 = await runCLI(['register-vehicle', testFleetId, 'GHI-789', 'motorcycle']);
      
      expect(result3.exitCode).toBe(0);
      expect(result3.stdout).toContain('Vehicle GHI-789 registered successfully');
    });

    it('should localize vehicles', async () => {
      const result1 = await runCLI(['localize-vehicle', testFleetId, 'ABC-123', '48.8566', '2.3522']);
      
      expect(result1.exitCode).toBe(0);
      expect(result1.stdout).toContain('Vehicle ABC-123 localized at 48.8566, 2.3522');

      const result2 = await runCLI(['localize-vehicle', testFleetId, 'DEF-456', '40.7128', '--', '-74.0060', '100']);
      
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain('Vehicle DEF-456 localized at 40.7128, -74.006, altitude: 100');
    });

    it('should get fleet information', async () => {
      const result = await runCLI(['info', testFleetId]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`Fleet ID: ${testFleetId}`);
      expect(result.stdout).toContain('Vehicle Count: 3');
      expect(result.stdout).toContain('ABC-123 (car)');
      expect(result.stdout).toContain('DEF-456 (truck)');
      expect(result.stdout).toContain('GHI-789 (motorcycle)');
    });

    it('should get vehicle locations', async () => {
      const result1 = await runCLI(['locate', testFleetId, 'ABC-123']);
      
      expect(result1.exitCode).toBe(0);
      expect(result1.stdout).toContain('Vehicle ABC-123 is located at:');
      expect(result1.stdout).toContain('Latitude: 48.8566');
      expect(result1.stdout).toContain('Longitude: 2.3522');

      const result2 = await runCLI(['locate', testFleetId, 'DEF-456']);
      
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain('Vehicle DEF-456 is located at:');
      expect(result2.stdout).toContain('Altitude: 100m');
    });
  });

  describe('Error Scenarios', () => {
    let errorTestFleetId: string;

    beforeAll(async () => {
      errorTestFleetId = await createTestFleet();
      
      await runCLI(['register-vehicle', errorTestFleetId, 'ABC-123', 'car']);
    });

    it('should handle duplicate vehicle registration', async () => {
      const result = await runCLI(['register-vehicle', errorTestFleetId, 'ABC-123', 'car']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Vehicle with plate number ABC-123 has already been registered');
    });

    it('should handle non-existent fleet', async () => {
      const result = await runCLI(['info', 'non-existent-fleet-id']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Fleet with ID non-existent-fleet-id not found');
    });

    it('should handle non-registered vehicle localization', async () => {
      const result = await runCLI(['localize-vehicle', errorTestFleetId, 'NON-EXISTENT', '48.8566', '2.3522']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Vehicle with plate number NON-EXISTENT is not registered');
    });

    it('should handle invalid vehicle type', async () => {
      const result = await runCLI(['register-vehicle', errorTestFleetId, 'XYZ-999', 'invalid-type']);
  
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unsupported vehicle type: invalid-type');
    });

    it('should handle vehicle location not found', async () => {
      await runCLI(['register-vehicle', errorTestFleetId, 'JKL-999', 'car']);
      
      const result = await runCLI(['locate', errorTestFleetId, 'JKL-999']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Vehicle location with plate number JKL-999 not found');
    });
  });

  describe('Command Validation', () => {
    it('should handle missing arguments', async () => {
      const result = await runCLI(['create']);
     
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error: missing required argument');
    });

    it('should handle unknown commands', async () => {
      const result = await runCLI(['unknown-command']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error: unknown command');
    });
  });
});
