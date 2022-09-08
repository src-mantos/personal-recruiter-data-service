// # sourceMappingURL=dist/test/dao/dao-integration.test.js.map
import * as types from '../../src';
import PostData from '../../src/entity/PostData';
import { IndeedPostScraper } from '../../src/scrape/impl/IndeedPostScraper';
import container from '../../src/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';

// This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 4);

const simpleSearch: types.IScrapeRequest = {
    keyword: 'full stack engineer',
    // location: 'Reston, VA',
    pageDepth: 2 /* this includes underling pagination handling and is required minimum for testing any scraper */
};

it('will scrape some data and store it', async () => {
    const indeed: IndeedPostScraper = container.resolve(IndeedPostScraper);
    await indeed.init();

    await indeed.run(new ScrapeRequest(simpleSearch));
    await indeed.clearInstanceData();
    const postData: PostData[] = <PostData[]>indeed.getPageData();

    // const orm = await MikroORM.init(ormOpts);
    // const postRepository = orm.em.getRepository(PostData);

    // for (const entry of postData) {
    //     postRepository.persist(entry);
    // }

    // await postRepository.flush();

    // await orm.close();
});
