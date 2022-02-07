//# sourceMappingURL=dist/scrape/IndeedPostScraper.js.map
import { PostScraper } from '../PostScraper';
import { chromium, FrameLocator, Page } from 'playwright';
import * as types from '../../types';

export class IndeedPostScraper extends PostScraper {

    async searchPostings(search: types.IPostDataScrapeRequest): Promise<types.IPostData[]> {
        await this.page?.goto('https://www.indeed.com/jobs?q='+encodeURIComponent(search.keyword));
        return [];
    }

    nextPage(): void {
        throw new Error('Method not implemented.');
    }

    getPageData(): types.IPostData[] {
        throw new Error('Method not implemented.');
    }
}
