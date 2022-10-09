import type { IPostData, IScrapeRequest, IScrapePostDataRequest, IRunState, IRunMetric } from '..';
import mongoose from 'mongoose';
import { v4 } from 'uuid';

/**
 * {@inheritDoc IScrapeRequest}
 * {@inheritDoc IScrapePostDataRequest}
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
    data?: IPostData[];

    constructor (opts?: IScrapeRequest) {
        // this._id = new mongoose.Types.ObjectId();
        this.requestTime = new Date();
        this.complete = false;
        this.metrics = [];
        this.pageDepth = 1;
        if (opts?.uuid !== undefined) {
            this.uuid = opts.uuid;
        }
        if (opts) {
            this.keyword = opts.keyword;
            this.location = opts.location;
            this.pageDepth = opts.pageDepth;
        }
    }

    keywords: string;
}
