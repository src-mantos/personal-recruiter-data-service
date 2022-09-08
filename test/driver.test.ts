// # sourceMappingURL=dist/test/scrape/driver.test.js.map
import 'reflect-metadata';
import * as types from '../src';
import PostData from '../src/entity/PostData';
import { PostScrapeManager } from '../src/scrape/PostScrapeManager';

import container from '../src/DIBindings';
import ScrapeRequest from '../src/entity/ScrapeRequest';

/**
 * This is where we want to validate the new additions and try new things.
 * Externalize the test for posterity and clarity
 */

// This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 10);

const simpleSearch: ScrapeRequest = new ScrapeRequest({
    keyword: 'full stack engineer',
    location: 'Seattle, WA',
    pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
});

it('will Check the consolidation refactor', async () => {
    const instance = container.resolve(PostScrapeManager);
    await instance._ready;
    const searchUuid = instance.processRequest(simpleSearch);
    expect(searchUuid).not.toBeNull();
    console.log(
        JSON.stringify({
            simpleSearch,
            searchUuid
        })
    );
    await instance._runComplete;
    await instance.destruct();
});
