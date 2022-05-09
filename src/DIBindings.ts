import { DicePostScraper } from '../src/scrape/impl/DicePostScraper';
import { IndeedPostScraper } from '../src/scrape/impl/IndeedPostScraper';
import { PostScraper } from './scrape/PostScraper';
import { container, InjectionToken, instanceCachingFactory } from 'tsyringe';
import dotenv from 'dotenv';

container.register<DicePostScraper>('PostScraper', { useClass: DicePostScraper });

container.register<IndeedPostScraper>('PostScraper', { useClass: IndeedPostScraper });

const result = dotenv.config();

if (result.error) {
    throw result.error;
}
const conf = result.parsed;
for (const key in conf) {
    container.register<string>(key, { useValue: conf[key] });
}

export default container;
