import 'reflect-metadata';
import * as types from '.';
import PostData from './entity/PostData';
import { PostScrapeManager } from './scrape/PostScrapeManager';

import container from './DIBindings';
import fs from 'fs';
import path from 'path';

import { MongoConnection } from './dao/MongoConnection';
// import { PostDataModel, PostDataSchema } from './dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
console.log('Starting!!');
(async () => {
    const simpleSearch: types.IScrapeRequest = {
        keyword: 'full stack engineer',
        // location: 'Seattle, WA',
        pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
    };

    const instance = container.resolve(PostScrapeManager);
    await instance._ready;

    const uuid1 = instance.queueRequest({
        keyword: 'full stack engineer',
        pageDepth: 1
    });

    const completion = instance.runPromiseQueue();
    const uuid2 = instance.queueRequest({
        keyword: 'java engineer',
        pageDepth: 1
    });

    setInterval(() => {
        console.log('************************************');
        console.log(JSON.stringify(instance.getRequestMetrics()));
        console.log('************************************');
    }, 60000);

    await completion;
    console.log({
        uuid1,
        uuid2
    });

    await instance.destruct();
})();
