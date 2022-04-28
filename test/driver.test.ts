//# sourceMappingURL=dist/test/scrape/driver.test.js.map
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
 * This is where we want to validate the new additions and try new things.
 * Externalize the test for posterity and clarity
 */

//This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 10);
ormOpts.allowGlobalContext = true;

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */,
};

it('will scrape through orchestration', async () => {
    const instance = container.resolve(PostScrapeManager);
    await instance._ready;
    const searchUuid = instance.processRequest(simpleSearch);
    expect(searchUuid).not.toBeNull();
    console.log(
        JSON.stringify({
            simpleSearch: simpleSearch,
            searchUuid: searchUuid,
        })
    );
    await instance._runComplete;
    await instance.destruct();
});
