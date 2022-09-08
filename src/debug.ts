#!/usr/bin/env ts-node
/* eslint-disable no-undef */
import 'reflect-metadata';
import * as types from '.';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';

import container from '../src/DIBindings';
import fs from 'fs';
import path from 'path';
import { MongoConnection } from './dao/MongoConnection';

let timer:NodeJS.Timer;
/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
 process.on('SIGINT', () => {
    // attempt graceful close of the search/scrape
    (async () => {
        console.log('shutting down the db connection');
        const conn = container.resolve(MongoConnection);
        await conn.disconnect();
        clearInterval(timer);
    })();
});

async function run () {
    const simpleSearch: types.IScrapeRequest = {
        keyword: 'full stack engineer',
        // location: 'Seattle, WA',
        pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
    };

    const instance = container.resolve(PostScrapeManager);
    await instance.initialize();
    instance.queueRequest(simpleSearch);

    timer = setInterval(() => {
        console.log('************************************');
        console.log(JSON.stringify(instance.getRequestMetrics()));
        console.log('************************************');
    }, 60000);

    await instance.runPromiseQueue();

    await instance.destruct();
    return 0;
}

run();
