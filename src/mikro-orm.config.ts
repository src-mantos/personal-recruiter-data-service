import { Options } from '@mikro-orm/core';
import { PostData } from './types';

const options: Options = {
    type: 'mongo',
    entities: [PostData],
    dbName: 'test',
    debug: true,
    validate: false,
    validateRequired: false,
};

export default options;
