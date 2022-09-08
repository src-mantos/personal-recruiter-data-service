import { DicePostScraper } from '../src/scrape/impl/DicePostScraper';
import { IndeedPostScraper } from '../src/scrape/impl/IndeedPostScraper';
import { container } from 'tsyringe';
import dotenv from 'dotenv';
import { PostDao } from './dao/PostDao';
import { ScrapeDao } from './dao/ScrapeDao';
import { MongoConnection } from './dao/MongoConnection';

container.register<DicePostScraper>('PostScraper', { useClass: DicePostScraper });

container.register<IndeedPostScraper>('PostScraper', { useClass: IndeedPostScraper });

container.register<PostDao>('PostDao', { useClass: PostDao });
container.register<ScrapeDao>('ScrapeDao', { useClass: ScrapeDao });

container.register<MongoConnection>('MongoConnection', { useClass: MongoConnection });

const result = dotenv.config();

if (result.error) {
    throw result.error;
}
const conf = result.parsed;
for (const key in conf) {
    if (key === 'db_clientUrl' && process.env.CONFIG_MONGODB_URL) {
        container.register<string>(key, { useValue: process.env.CONFIG_MONGODB_URL });
    } else {
        container.register<string>(key, { useValue: conf[key] });
    }
}

export default container;
