import { program } from 'commander';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

const SERVICES = {
  sa: {
    path: path.join(__dirname, '..', '..', 'apps', 'sa'),
    devScript: 'npm run dev',
    startScript: 'npm run start',
  },
  sb: {
    path: path.join(__dirname, '..', '..', 'apps', 'sb'),
    devScript: 'npm run dev',
    startScript: 'npm run start',
  },
};

function startServiceInNewTerminal(
  serviceName: keyof typeof SERVICES,
  scriptType: 'devScript' | 'startScript'
): ChildProcess {
  const service = SERVICES[serviceName];
  const script = service[scriptType];

  if (!fs.existsSync(service.path)) {
    console.error(`Service path does not exist: ${service.path}`);
    process.exit(1);
  }

  console.log(
    `Starting ${serviceName} with script "${script}" in a new terminal...`
  );

  // Determine the terminal command based on the OS
  const terminalCommand =
    process.platform === 'win32' ? 'start' : 'gnome-terminal'; // You may need to change the terminal command based on your OS

  const terminalProcess = spawn(
    terminalCommand,
    ['--', 'bash', '-c', `cd ${service.path} && ${script}`],
    {
      detached: true,
      stdio: 'ignore', // Ignore the terminal output in the original terminal window
    }
  );

  return terminalProcess;
}

async function bootstrap() {
  program
    .name('service-cli')
    .description('CLI tool for managing Nx monorepo services')
    .version('1.0.0');

  program
    .command('start:dev <service>')
    .description(
      'Start a specific service in development mode (sa or sb) in a new terminal'
    )
    .action((service: string) => {
      if (!SERVICES[service as keyof typeof SERVICES]) {
        console.error('Invalid service. Choose "sa" or "sb".');
        process.exit(1);
      }
      startServiceInNewTerminal(service as keyof typeof SERVICES, 'devScript');
    });

  program
    .command('start:prod <service>')
    .description(
      'Start a specific service in production mode (sa or sb) in a new terminal'
    )
    .action((service: string) => {
      if (!SERVICES[service as keyof typeof SERVICES]) {
        console.error('Invalid service. Choose "sa" or "sb".');
        process.exit(1);
      }
      startServiceInNewTerminal(
        service as keyof typeof SERVICES,
        'startScript'
      );
    });

  program
    .command('start:dev:all')
    .description('Start all services in development mode in new terminals')
    .action(async () => {
      Object.keys(SERVICES).forEach((serviceName) => {
        startServiceInNewTerminal(
          serviceName as keyof typeof SERVICES,
          'devScript'
        );
      });
    });

  program
    .command('start:prod:all')
    .description('Start all services in production mode in new terminals')
    .action(async () => {
      Object.keys(SERVICES).forEach((serviceName) => {
        startServiceInNewTerminal(
          serviceName as keyof typeof SERVICES,
          'startScript'
        );
      });
    });

  program.on('command:*', () => {
    console.error(
      'Invalid command: %s\nSee --help for a list of available commands.',
      program.args.join(' ')
    );
    process.exit(1);
  });

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('CLI Error:', error);
    process.exit(1);
  }
}

bootstrap();
