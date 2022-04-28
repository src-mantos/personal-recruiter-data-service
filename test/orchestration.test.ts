//# sourceMappingURL=dist/test/scrape/driver.test.js.map
import * as types from '../src/types';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import ormOpts from '../src/mikro-orm.config';

/**
 * This is where we want to validate the new additions and try new things.
 * Externalize the test for posterity and clarity
 */

//This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 4);
ormOpts.allowGlobalContext = true;

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2 /* this includes underling pagination handling and is required minimum for testing any scraper */,
};

it.skip('will scrape through orchestration', async () => {
    const psm = new PostScrapeManager();
    const searchUuid = psm.processRequest(simpleSearch);
});
