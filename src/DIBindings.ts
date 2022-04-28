import { DicePostScraper } from '../src/scrape/impl/DicePostScraper';
import { IndeedPostScraper } from '../src/scrape/impl/IndeedPostScraper';
import { PostScraper } from './scrape/PostScraper';
import { container, InjectionToken, instanceCachingFactory } from 'tsyringe';

// Callback signature is (token: InjectionToken<T>, result: T | T[], resolutionType: ResolutionType)
function initializeScraper<T extends PostScraper>(_t: InjectionToken<T>, result: T | T[]) {
    if (Array.isArray(result)) {
        for (const inst of result) {
            inst.init();
        }
    } else {
        result.init();
    }
}

container.afterResolution(DicePostScraper, initializeScraper, { frequency: 'Once' });
container.register<DicePostScraper>('PostScraper', { useClass: DicePostScraper });
// container.register<DicePostScraper>('PostScraper', { useFactory: instanceCachingFactory<DicePostScraper>( async (c)=>{
//     const ret = c.resolve(DicePostScraper);
//     await ret.init();
// }) });

container.afterResolution(IndeedPostScraper, initializeScraper, { frequency: 'Once' });
container.register<IndeedPostScraper>('PostScraper', { useClass: IndeedPostScraper });

export default container;
