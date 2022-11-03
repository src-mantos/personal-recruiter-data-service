import type { IPostData, IScrapeRequest, IScrapePostDataRequest, IRunState, IRunMetric } from '../types';
import mongoose from 'mongoose';
import { v4 } from 'uuid';

/**
 * @see {IScrapeRequest} & @see {IScrapePostDataRequest}
 * the Scrape Request Implementation uses 2 interfaces, 1 publicly facing and the other for internal use.
 * {@inheritDoc IScrapeRequest} {@inheritDoc IScrapePostDataRequest}
 */
export default class ScrapeRequest implements IScrapeRequest, IScrapePostDataRequest {
    _id: mongoose.Types.ObjectId;

    uuid: string = v4();
    requestTime?: Date;
    keyword: string;
    location?: string;
    pageDepth: number;

    // results: Collection<PostData> = new Collection<PostData>(this);

    complete: boolean;
    metrics: IRunMetric[];
    posts: IPostData[];

    constructor (opts?: IScrapeRequest) {
        this.requestTime = new Date();
        this.complete = false;
        this.metrics = [];
        this.pageDepth = 1;
        this.posts = [];
        if (opts?.uuid !== undefined) {
            this.uuid = opts.uuid;
        }
        if (opts) {
            this.keyword = opts.keyword;
            this.location = opts.location;
            this.pageDepth = opts.pageDepth;
        }
    }
}
