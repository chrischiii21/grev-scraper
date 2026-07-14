import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { validateConfig, type Config } from './builder';

let cachedConfig: Config | null = null;

export const loadConfig = (): Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.resolve(process.cwd(), 'src/config.yaml');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const rawConfig = yaml.load(fileContents);

  cachedConfig = validateConfig(rawConfig);
  return cachedConfig;
};
