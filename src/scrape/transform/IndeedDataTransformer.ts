//# sourceMappingURL=dist/src/scrape/transform/DataTransformer.js.map
import DataTransformer from './DataTransformer';
import { IPostData } from '../../../src/types';
import PostData from '../../entity/PostData';

export class IndeedDataTransformer extends DataTransformer<IPostData, PostData> {
    transform(input: IPostData[]): PostData[] {
        throw new Error('Method not implemented.');
    }
    private processElement(input: IPostData): PostData {
        throw new Error('Method not implemented.');
        // let ret = new PostData();
        // for(let key in input){
        //     ret[key] = input[key];
        // }
        // return ret;
    }
}
