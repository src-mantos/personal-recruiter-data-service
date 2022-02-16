//# sourceMappingURL=dist/scrape/driver.test.js.map
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import * as types from '../../src/types';
import * as fs from 'fs';

/**
 * This is where we want to validate the new additions and try new things.
 * Externalize the test for posterity and clarity
 */

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2,
};

const indeed: IndeedPostScraper = new IndeedPostScraper();

jest.setTimeout(1000 * 60 * simpleSearch.pageDepth);

it('should complete a basic search', async () => {
    await indeed.init();
    const postData: types.IPostData[] = await indeed.searchPostings(simpleSearch);
    expect(postData).not.toBeNull();
    expect(postData).not.toBeUndefined();
    indeed.clearInstanceData();
});
