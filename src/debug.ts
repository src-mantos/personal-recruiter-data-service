#!/usr/bin/env ts-node
/**
 * Education Runnable, Not a main runnable class
 */
import 'reflect-metadata';
import container from './util/DIBindings';
import { MongoConnection } from './dao/MongoConnection';
import { IScrapeRequest } from './types';
import { ScrapeQueueRunner } from './scrape/ScrapeQueueRunner';

/* eslint-disable no-undef */
let timer:NodeJS.Timer;
/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
process.on('SIGINT', () => {
    // attempt graceful close of the search/scrape
    (async () => {
        clearInterval(timer);
        console.log('shutting down the db connection');
        const conn = container.resolve(MongoConnection);
        await conn.disconnect();
    })();
});

async function run () {
    const simpleSearch: IScrapeRequest = {
        keyword: 'full stack engineer',
        // location: 'washington',
        pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
    };

    const scrapeRunner: ScrapeQueueRunner = container.resolve(ScrapeQueueRunner);
    scrapeRunner.enqueue(simpleSearch);

    timer = setInterval(() => {
        console.log('************************************');
        console.log(JSON.stringify(scrapeRunner.getQueueStatus()));
        console.log('************************************');
    }, 60000);

    await scrapeRunner.altRun(); // runQueue();
    clearInterval(timer);
}

run();
