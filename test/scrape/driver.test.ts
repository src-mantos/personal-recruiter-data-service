//# sourceMappingURL=dist/scrape/driver.test.js.map
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import * as types from '../../src/types';


/**
 * This is where we want to validate the new additions and try new things.
 * Externalize the test for posterity and clarity
 */


const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: "full stack engineer",
    pageDepth: 1
};

let indeed: IndeedPostScraper;
beforeAll(()=>{
    indeed = new IndeedPostScraper();
})
afterAll(()=>{
    indeed?.clearInstanceData();
})

describe("the simplest search on the Indeed Scrape Interface",() => {
    
    const postData = indeed.searchPostings(simpleSearch);
    test("some kind of data is returned",() => {
        expect(postData).not.toBeNull();
        expect(postData).not.toBeUndefined();
    });

})