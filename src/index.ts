/**
 * Primary Interfaces
 * @module api
 */

/**
 * ISearchQuery -
 * Basic query object for Post Data
 * @category External
 * @typedef {object} ISearchQuery
 * @property {string} keywords.required
 * @property {ISearchFilter[]} filters
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
/**
 * Experimental filter object
 * @category External
 * @typedef {object} ISearchFilter
 * @property {string} key
 * @property {object} value
 */
export interface ISearchFilter {
    key: string;
    value: any;
}

/**
 * IPostData -
 * The Standard Job Post Data that will be scraped from underlying services
 * @category External
 * @typedef {object} IPostData
 * @property {string} _id - unique identifier
 * @property {IVendorMetadata} vendorMetadata - vendor specific raw metadata for manual comparison
 * @property {IPostDataIndex} indexMetadata - this should default to not provided unless requested
 * @property {IScrapeRequest} request - @todo rename to originalRequest
 * @property {string} captureTime - record creation time
 * @property {string} postedTime - captured posting date, will need to parse this into a date object
 * @property {string} directURL
 * @property {string} title - Main label from source
 * @property {string} organization - Job Poster
 * @property {string} location
 * @property {string} description
 * @property {string} salary
 */
export interface IPostData {
    _id?: any;
    vendorMetadata?: IVendorMetadata;
    indexMetadata?: IPostDataIndex;
    request?: IScrapeRequest;
    captureTime: Date;
    directURL: string;
    title: string;
    organization: string;
    location: string;
    description: string;
    salary?: string;
    postedTime: string;
}

/**
 * standardizing intermediate scrape products
 * @category External
 * @typedef {object}
 * @property {object} metadata - automated first pass processing
 * @property {object} rawdata - capture products
 */
export interface IVendorMetadata {
    metadata: { [key: string]: any };
    rawdata: { [key: string]: any };
}

/**
 * metric data about the job posting
 * @category Internal
 * @typedef {object} IPostData
 * @property {integer} pageSize - number of posts on a page
 * @property {integer} postIndex - current post index
 * @property {integer} pageIndex - current page index @see pageDepth
 * @property {boolean} completed - request complete
 */
export interface IPostDataIndex {
    pageSize: number;
    postIndex: number;
    pageIndex: number;
    completed: boolean;
}

/**
 * IScrapeRequest -
 * The standard job post data request object
 * @category External
 * @typedef {object} IScrapeRequest
 * @property {string} uuid
 * @property {string} keyword.required - Search Keywords
 * @property {integer} pageDepth - Number of pages to scrape
 * @property {string} location
 * @property {string} requestTime - date-time of request enqueue
 */
export interface IScrapeRequest {
    uuid?: string;
    requestTime?: Date;
    keyword: string;
    location?: string;
    pageDepth: number;
}

/**
 * IScrapePostDataRequest
 * @category Internal
 * @typedef {object} IScrapePostDataRequest
 * @property {string} _id - unique object id
 * @property {boolean} complete - is request complete
 * @property {object} metrics - @see {IRunMetric}
 * @property {object} data - IPostData[] - @see {IPostData}
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
 * Separating scrape processes from other operations
 * @see https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
 * @category Internal
 */
export interface IPC<T> {
    operation: 'requestUpdates'|'postData'|'error'|'exit',
    payload: T
}

/**
 * Internal Component Error
 * Base Error Class for explicate error handling?
 * Removing `extends` due to inheritance issues
 * https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
 * @category Errors
 * @group error
 * @typedef {object} ComponentError
 * @property {string} name
 * @property {any} message
 * @property {string} stack
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
