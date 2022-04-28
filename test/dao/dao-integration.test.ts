//# sourceMappingURL=dist/test/dao/dao-integration.test.js.map
import * as types from '../../src/types';
import PostData from '../../src/entity/PostData';
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import { MikroORM } from '@mikro-orm/core';
import ormOpts from '../../src/mikro-orm.config';

//This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 4);
ormOpts.allowGlobalContext = true;

const simpleSearch: types.IPostDataScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2 /* this includes underling pagination handling and is required minimum for testing any scraper */,
};

it('will scrape some data and store it', async () => {
    const indeed: IndeedPostScraper = new IndeedPostScraper();
    await indeed.init();

    const postData: PostData[] = <PostData[]>await indeed.searchPostings(simpleSearch);
    indeed.clearInstanceData();

    const orm = await MikroORM.init(ormOpts);
    const postRepository = orm.em.getRepository(PostData);

    for (const entry of postData) {
        postRepository.persist(entry);
    }

    await postRepository.flush();

    await orm.close();
});
