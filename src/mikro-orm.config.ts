import { Options } from '@mikro-orm/core';

const options: Options = {
    type: 'mongo',
    entitiesTs: ['./src/entity'],
    dbName: 'post-data-repo',
    debug: true,
    validate: false,
    validateRequired: false,
};

export default options;
