//# sourceMappingURL=dist/src/scrape/transform/DataTransformer.js.map
export default abstract class DataTransformer<IType, CType> {
    abstract transform(input: IType[]): CType[];
}
