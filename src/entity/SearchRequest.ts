//# sourceMappingURL=dist/src/entity/SearchRequest.js.map
import type { IPostDataSearchRequest } from '../types';
import { v4 } from 'uuid';
import mongoose from 'mongoose';

export default class SearchRequest implements IPostDataSearchRequest {
    _id: mongoose.Types.ObjectId;

    uuid: string = v4();
    requestTime?: Date;
    keywords: string;
    location?: string;

    constructor(opts?: IPostDataSearchRequest) {
        this.requestTime = new Date();
        if (opts) {
            this.keywords = opts.keywords;
            this.location = opts.location;
        }
    }
}
