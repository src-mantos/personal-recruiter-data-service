//# sourceMappingURL=dist/src/entity/ScrapeRequest.js.map
import type { IPostData, IPostDataScrapeRequest, IRunState, IRunMetric } from '..';
import mongoose from 'mongoose';
import { v4 } from 'uuid';

export interface ScrapeSchema extends IPostDataScrapeRequest, IRunState {
    _id: mongoose.Types.ObjectId;
    data?: IPostData[];
}
export default class ScrapeRequest implements ScrapeSchema {
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

    constructor(opts?: IPostDataScrapeRequest) {
        // this._id = new mongoose.Types.ObjectId();
        this.requestTime = new Date();
        this.complete = false;
        this.metrics = [];
        this.pageDepth = 1;
        if (opts) {
            this.keyword = opts.keyword;
            this.location = opts.location;
            this.pageDepth = opts.pageDepth;
        }
    }
    keywords: string;
}
