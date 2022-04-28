//# sourceMappingURL=dist/test/scrape/DiceScrape.test.js.map
import * as types from '../../src/types';
import PostData from '../../src/entity/PostData';
import { DicePostScraper } from '../../src/scrape/impl/DicePostScraper';

//This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 8);

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */,
};

const dice: DicePostScraper = new DicePostScraper();
it('should complete a basic search', async () => {
    await dice.init();
    const postData: types.IPostData[] = await dice.searchPostings(simpleSearch);
    expect(postData).not.toBeNull();
    expect(postData).not.toBeUndefined();
    for (const elem of postData) {
        console.log(JSON.stringify(elem));
    }
    dice.clearInstanceData();
});
