//# sourceMappingURL=dist/test/scrape/IndeedScrape.test.js.map
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import * as types from '../../src/types';

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2 /* this includes underling pagination handling and is required minimum for testing any scraper */,
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
