//# sourceMappingURL=dist/test/scrape/IndeedScrape.test.js.map
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import * as types from '../../src';
import container from '../../src/DIBindings';
import PostData from '../../src/entity/PostData';
import ScrapeRequest from '../../src/entity/ScrapeRequest';

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2 /* this includes underling pagination handling and is required minimum for testing any scraper */,
};

const indeed: IndeedPostScraper = container.resolve(IndeedPostScraper);

jest.setTimeout(1000 * 60 * simpleSearch.pageDepth);

it('should complete a basic search', async () => {
    await indeed.init();
    await indeed.run(new ScrapeRequest(simpleSearch));
    await indeed.clearInstanceData();
    const postData: PostData[] = <PostData[]>indeed.getPageData();

    expect(postData).not.toBeNull();
    expect(postData).not.toBeUndefined();
});
