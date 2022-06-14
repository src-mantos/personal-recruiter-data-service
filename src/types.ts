//# sourceMappingURL=dist/src/types.js.map
/* eslint-disable @typescript-eslint/ban-types */

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
 * IPostDataIndex -
 * metric data about the job posting
 */
export interface IPostDataIndex {
    /** number of posts on a page */
    pageSize: number;
    /** current post index */
    postIndex: number;
    /** current page index */
    pageIndex: number;
    /** has the post been fully scraped? */
    completed: boolean;
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
    vendorMetadata?: IVendorMetadata;
    /** @type {IPostDataIndex} */
    indexMetadata?: IPostDataIndex;
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
 * IRunState -
 * communicating metrics out of the scrape/capture interface
 */
export interface IRunState {
    complete: boolean;
    metrics: IRunMetric[];
}
export interface IRunMetric {
    vendorDesc: string;
    numTotal: number;
    numComplete: number;
    pageSize: number;
}
/**
 * Base Error Class for explicate error handling?
 * Removing `extends` due to inheritance issues
 * https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
 */
export class ComponentError implements Error {
    name: string;
    message: any;
    stack?: string;
    constructor(msg: any, name?: string) {
        this.name = !name ? '[CE]' : name;
        this.message = msg;
    }
    toString(): string {
        return this.name + ' ' + JSON.stringify(this.message);
    }
}
export class NavigationError extends ComponentError {
    constructor(input: any) {
        super(input);
    }
}
/**Not Used, i just wanted to have a reference */
function aspectAnnotationExample(retryCount = 3) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any) {
            for (let i = 0; i < retryCount; i++) {
                console.log('%d / %d', i, retryCount);
                try {
                    return originalMethod.apply(this, args);
                } catch (ex) {
                    console.error('Method Failure: ', JSON.stringify(ex));
                }
            }
        };
        return descriptor;
    };
}
