import { DicePostScraper } from '../src/scrape/impl/DicePostScraper';
import { IndeedPostScraper } from '../src/scrape/impl/IndeedPostScraper';
import { container, InjectionToken, instanceCachingFactory } from 'tsyringe';
import dotenv from 'dotenv';
import { PostDao } from './dao/PostDao';
import { SearchDao } from './dao/SearchDao';

container.register<DicePostScraper>('PostScraper', { useClass: DicePostScraper });

container.register<IndeedPostScraper>('PostScraper', { useClass: IndeedPostScraper });

container.register<PostDao>('PostDao', { useClass: PostDao });
container.register<SearchDao>('SearchDao', { useClass: SearchDao });

const result = dotenv.config();

if (result.error) {
    throw result.error;
}
const conf = result.parsed;
for (const key in conf) {
    container.register<string>(key, { useValue: conf[key] });
}

export default container;
