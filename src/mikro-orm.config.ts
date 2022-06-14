import { Options, ReflectMetadataProvider } from '@mikro-orm/core';

export const ormOpts: Options = {
    type: 'mongo',
    entitiesTs: ['./src/entity'],
    entities: ['./dist/src/entity'],
    dbName: 'post-data-repo',
    debug: true,
    validate: false,
    validateRequired: false,
    clientUrl: 'mongodb://root:example@localhost:27017/',
    metadataProvider: ReflectMetadataProvider,
};

export const PropDefaults = {
    Nullable: { nullable: true },
    Unique: { unique: true },
};
