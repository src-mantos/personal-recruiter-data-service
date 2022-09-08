import 'reflect-metadata';
import * as types from '../src';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';

import container from '../src/DIBindings';
import fs from 'fs';
import path from 'path';
import { MongoConnection } from '../src/dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */

it('will scrape some data and store it', async () => {
    const simpleSearch: types.IScrapeRequest = {
        keyword: 'full stack engineer',
        // location: 'Seattle, WA',
        pageDepth: 3 /* this includes underling pagination handling and is required minimum for testing any scraper */
    };

    const instance = container.resolve(PostScrapeManager);
    // await instance._ready;
    // const searchUuid = instance.processRequest(simpleSearch);
    // setInterval(() => {
    //     console.log('************************************');
    //     console.log(JSON.stringify(instance.getRequestMetrics()));
    //     console.log('************************************');
    // }, 60000);

    // console.log(
    //     JSON.stringify({
    //         simpleSearch,
    //         searchUuid
    //     })
    // );
    // await instance._runComplete;
    // await instance.destruct();
    // const conn = container.resolve(MongoConnection);
    // await conn.disconnect();
});
