import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  clearMocks: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
export default config;