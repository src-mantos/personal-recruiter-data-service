import 'reflect-metadata';
import * as types from '../src/types';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';
import { DicePostScraper } from '../src/scrape/impl/DicePostScraper';
import { IndeedPostScraper } from '../src/scrape/impl/IndeedPostScraper';
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import ormOpts from '../src/mikro-orm.config';
import container from '../src/DIBindings';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */

ormOpts.allowGlobalContext = true;

async function run() {
    const simpleSearch: types.IPostDataScrapeRequest = {
        keyword: 'full stack engineer',
        location: 'Reston, VA',
        pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */,
    };

    const instance = container.resolve(PostScrapeManager);
    await instance._ready;
    const searchUuid = instance.refactorRequest(simpleSearch);

    console.log(
        JSON.stringify({
            simpleSearch: simpleSearch,
            searchUuid: searchUuid,
        })
    );
    await instance._runComplete;
    await instance.destruct();
}

run();
