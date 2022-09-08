// # sourceMappingURL=dist/test/scrape/DiceScrape.test.js.map
import * as types from '../../src';
import PostData from '../../src/entity/PostData';
import { DicePostScraper } from '../../src/scrape/impl/DicePostScraper';
import container from '../../src/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';

// This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 8);

const simpleSearch: types.IScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
};

const dice: DicePostScraper = container.resolve(DicePostScraper);
it('should complete a basic search', async () => {
    await dice.init();
    await dice.run(new ScrapeRequest(simpleSearch));
    await dice.clearInstanceData();
    const postData: PostData[] = <PostData[]>dice.getPageData();

    expect(postData).not.toBeNull();
    expect(postData).not.toBeUndefined();
    for (const elem of postData) {
        console.log(JSON.stringify(elem));
    }
});
