//# sourceMappingURL=dist/src/types.js.map
/* eslint-disable @typescript-eslint/ban-types */

/**
 * IPostDataScrapeRequest -
 * The standard job post data request object
 *
 */
export interface IPostDataScrapeRequest {
    /** @type {string} UUID for corrolating search results*/
    uuid?: string;
    /** @type {Date} Search Reuqest time*/
    requestTime?: Date;
    /** @type {string} Primary Search Term*/
    keyword: string;
    /** @type {string} Optional Location Parameter*/
    location?: string;
    /** @type {number} Number of pages to scrape*/
    pageDepth: number;
}

/**
 * IPostDataSearchRequest -
 * The job post data primary filter query object
 *
 */
export interface IPostDataSearchRequest {
    /** @type {object} Descriptive Search/Query Interface*/
    keywords: {
        'must-have': string;
        'must-not-have': string;
        'should-have': string;
        'should-not-have': string;
    };
    /** @type {string} Optional Location Parameter*/
    location?: string;
}

/**
 * IVendorMetadata -
 * standardizing intermediate scrape products
 */
export interface IVendorMetadata {
    metadata: { [key: string]: any };
    rawdata: { [key: string]: any };
}
/**
 * IPostData -
 * The Standard Job Post Data that will be scraped from underlying services
 *
 */
export interface IPostData {
    /** @type {string} */
    directURL: string;
    /**@type {IVendorMetadata} vendor specific metadata associated to a post that may or may not be useful*/
    vendorMetadata: IVendorMetadata;
    /** @type {number} the ranking from [1 - ({@link IPostDataScrapeRequest.pageDepth} x service page size)*/
    searchIndex: number;
    /** @type {Date} */
    captureTime: Date;

    /** @type {string} Main label from source*/
    title: string;
    /** @type {string} Job Poster*/
    organization: string;
    /** @type {string} location data*/
    location: string;
    /** @type {string} */
    description: string;
    /** @type {string} optional salary information*/
    salary?: string;
    /** @type {string} captured posting date, will need to parse this into a date object*/
    postedTime: string;
}
