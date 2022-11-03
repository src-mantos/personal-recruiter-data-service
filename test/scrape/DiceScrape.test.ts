/* eslint-disable no-unused-expressions */
import { assert, expect } from 'chai';
import { it } from 'mocha';
import { IScrapeRequest } from '../../src/types';
import PostData from '../../src/entity/PostData';
import { DicePostScraper } from '../../src/scrape/impl/DicePostScraper';
import container from '../../src/util/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';

// This flag should be stored as run configuration
// jest.setTimeout(1000 * 60 * 3);

const simpleSearch: IScrapeRequest = {
    keyword: 'full stack engineer',
    location: 'Washington DC', /* confirm location functionality */
    pageDepth: 2 /* min test to confirm pagination */
};

const dice: DicePostScraper = container.resolve(DicePostScraper);
it('Unit Integration: Dice scrape', async () => {
    await dice.init();
    await dice.run(new ScrapeRequest(simpleSearch));
    await dice.clearInstanceData();
    const postData: PostData[] = <PostData[]>dice.getPageData();

    expect(postData).to.not.be.null;
    expect(postData).to.not.be.undefined;
    expect(postData.length).to.be.greaterThan(0);
    for (const elem of postData) {
        console.log(JSON.stringify(elem));
    }
});
