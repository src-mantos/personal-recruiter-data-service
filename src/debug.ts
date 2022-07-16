import 'reflect-metadata';
import * as types from '../src/types';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';

import container from '../src/DIBindings';
import fs from 'fs';
import path from 'path';
import { MongoConnection } from './dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */

async function run() {
    const simpleSearch: types.IPostDataScrapeRequest = {
        keyword: 'full stack engineer',
        //location: 'Seattle, WA',
        pageDepth: 3 /* this includes underling pagination handling and is required minimum for testing any scraper */,
    };

    const instance = container.resolve(PostScrapeManager);
    await instance._ready;
    const searchUuid = instance.processRequest(simpleSearch);
    setInterval(() => {
        console.log('************************************');
        console.log(JSON.stringify(instance.getRequestMetrics()));
        console.log('************************************');
    }, 60000);

    console.log(
        JSON.stringify({
            simpleSearch: simpleSearch,
            searchUuid: searchUuid,
        })
    );
    await instance._runComplete;
    // let i = 1;
    // for (const post of instance.requestData) {
    //     const filePath = path.join(__dirname, '../dist', 'ScrapeResult-3-' + i + '-data.json');
    //     i++;
    //     fs.writeFile(filePath, JSON.stringify(post, null, 4), function (err) {
    //         let msg = filePath + ' Completed.';
    //         if (err) msg = err.message;
    //         console.log(msg);
    //     });
    // }
    await instance.destruct();
    const conn = container.resolve(MongoConnection);
    await conn.disconnect();
}

run();
