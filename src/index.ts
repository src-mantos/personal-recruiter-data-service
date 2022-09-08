/**
 * Primary Interfaces
 * @module api
 */

/**
 * ISearchQuery -
 * The job post data primary filter query object
 * @category External
 */
export interface ISearchQuery {
    /**
     * mongodb style text search query
     */
    keywords: string;
    /**
     * Optional Location Parameter
     */
    location?: string;
    /**
     * place holder for composite filter
     * @experimental
     */
    filters?: ISearchFilter[];
}
export interface ISearchFilter {
    key: string;
    value: any;
}

/**
 * IPostData -
 * The Standard Job Post Data that will be scraped from underlying services
 * @category External
 */
export interface IPostData {
    /**
     * external placeholder for internal ID typing
     */
    _id?: any;

    /**
     * vendor specific metadata associated to a post that may or may not be useful
     */
    vendorMetadata?: IVendorMetadata;

    indexMetadata?: IPostDataIndex;
    captureTime: Date;
    directURL: string;
    request?: IScrapeRequest;

    /**
     * Main label from source
     */
    title: string;
    /**
     * Job Poster
     */
    organization: string;
    location: string;
    description: string;
    salary?: string;
    /**
     * captured posting date, will need to parse this into a date object
     */
    postedTime: string;
}

/**
 * standardizing intermediate scrape products
 */
export interface IVendorMetadata {
    metadata: { [key: string]: any };
    rawdata: { [key: string]: any };
}

/**
 * metric data about the job posting
 */
export interface IPostDataIndex {
    /**
     * number of posts on a page
     */
    pageSize: number;
    /**
     * current post index
     */
    postIndex: number;
    /**
     * current page index
     */
    pageIndex: number;
    /**
     * has the post been fully scraped?
     */
    completed: boolean;
}

/**
 * IScrapeRequest -
 * The standard job post data request object
 * @category External
 */
export interface IScrapeRequest {
    /** @type {string} UUID for corrolating search results */
    uuid?: string;
    /** @type {Date} Search Reuqest time */
    requestTime?: Date;
    /** @type {string} Primary Search Term */
    keyword: string;
    /** @type {string} Optional Location Parameter */
    location?: string;
    /** @type {number} Number of pages to scrape */
    pageDepth: number;
}

/**
 * @category Internal
 */
export interface IScrapePostDataRequest {
    // external placeholder for internal ID typing
    _id: any;

    // has completed
    complete: boolean;
    // the raw metrics from individual scrape implementations
    metrics: IRunMetric[];
    // Optional scrape result set
    data?: IPostData[];
}
/**
 * communicating metrics out of the scrape/capture interface
 * @category Internal
 */
export interface IRunState {
    complete: boolean;
    metrics: IRunMetric[];
}
/**
 * Scrape implementation metrics
 * @category Internal
 */
export interface IRunMetric {
    vendorDesc: string;
    numTotal: number;
    numComplete: number;
    pageSize: number;
}

/**
 * Internal Component Error
 * Base Error Class for explicate error handling?
 * Removing `extends` due to inheritance issues
 * https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
 * @category Errors
 * @group error
 */
export class ComponentError implements Error {
    name: string;
    message: any;
    stack?: string;
    constructor (msg: any, name?: string) {
        this.name = !name ? '[CE]' : name;
        this.message = msg;
    }

    toString (): string {
        return this.name + ' ' + JSON.stringify(this.message);
    }
}
/**
 * Used to report navigation specific exceptions...
 * @category Errors
 * @group error
 */
export class NavigationError extends ComponentError { }

/** Not Used, i just wanted to have a reference */
function aspectAnnotationExample (retryCount = 3) {
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
