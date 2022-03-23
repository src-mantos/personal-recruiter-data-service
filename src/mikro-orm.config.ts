import { Options } from '@mikro-orm/core';
import { PostData, MonRec } from './types';

const options: Options = {
    type: 'mongo',
    entities: [PostData, MonRec],
    dbName: 'test',
    debug: true,
    validate: false,
    validateRequired: false,
};

export default options;
