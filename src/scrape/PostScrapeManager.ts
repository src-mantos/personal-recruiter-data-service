//# sourceMappingURL=dist/scrape/PostScrapeManager.js.map
import * as types from '../types';
import { PostScraper } from './PostScraper';
/**
 * PostScrapeManager -
 * The primary driver for orchestrating the collection of scrape posting data
 * 
 */
 export class PostScrapeManager{
    
    interfaces: PostScraper[];
    
    constructor() {
        this.interfaces = [];
    }

    /**
     * Takes in a search parameter to be processed by multiple interfaces.  <br/>
     * The actual scraping will be long running process and we want to provide an identifier so that the process can be referenced later.
     * @param searchQuery 
     */
    async processRequest(searchQuery: types.IPostDataScrapeRequest): Promise<number>{
        throw new Error('Method not implemented.');
    }
    
    /**
     * General purpose data storage for the job posting data
     * @param postData 
     */
    async storePostData(postData: types.IPostData[]):Promise<void>{
        throw new Error('Method not implemented.');
    }
}