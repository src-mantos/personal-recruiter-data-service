/* eslint-disable no-unused-expressions */
import { assert, expect } from 'chai';
import { it } from 'mocha';
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import { IScrapeRequest } from '../../src/types';
import container from '../../src/util/DIBindings';
import PostData from '../../src/entity/PostData';
import ScrapeRequest from '../../src/entity/ScrapeRequest';

const simpleSearch: IScrapeRequest = {
    keyword: 'full stack engineer',
    location: 'Washington DC', /* confirm location functionality */
    pageDepth: 2 /* min test to confirm pagination */
};

const indeed: IndeedPostScraper = container.resolve(IndeedPostScraper);

it('Unit Integration: Indeed scrape', async () => {
    await indeed.init();
    await indeed.run(new ScrapeRequest(simpleSearch));
    await indeed.clearInstanceData();
    const postData: PostData[] = <PostData[]>indeed.getPageData();

    expect(postData).to.not.be.null;
    expect(postData).to.not.be.undefined;
    expect(postData.length).to.be.greaterThan(0);
});
