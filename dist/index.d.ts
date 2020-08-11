export declare type MarkovInputData = Array<{
    string: string;
}>;
export declare type MarkovGenerateOptions = {
    maxTries?: number;
    prng?: () => number;
    filter?: (result: MarkovResult) => boolean;
};
export declare type MarkovConstructorOptions = {
    stateSize?: number;
};
export declare type MarkovResult = {
    string: string;
    score: number;
    refs: MarkovInputData;
    tries: number;
};
export declare type MarkovFragment = {
    words: string;
    refs: MarkovInputData;
};
export declare type Corpus = {
    [key: string]: MarkovFragment[];
};
export declare type MarkovImportExport = {
    corpus: Corpus;
    startWords: MarkovFragment[];
    endWords: MarkovFragment[];
    options: MarkovConstructorOptions;
};
export default class Markov {
    data: MarkovInputData;
    options: MarkovConstructorOptions;
    startWords: MarkovFragment[];
    endWords: MarkovFragment[];
    corpus: Corpus;
    private defaultOptions;
    /**
     * Creates an instance of Markov generator.
     *
     * @param {MarkovConstructorOptions} [options={}]
     * @memberof Markov
     */
    constructor(options?: MarkovConstructorOptions);
    /**
     * Imports a corpus. This overwrites existing data.
     *
     * @param data
     */
    import(data: MarkovImportExport): void;
    /**
     * Exports structed data used to generate sentence.
     */
    export(): MarkovImportExport;
    addData(rawData: MarkovInputData | string[]): void;
    /**
     * Builds the corpus. You must call this before generating sentences.
     *
     * @memberof Markov
     */
    private buildCorpus;
    /**
     * `.buildCorpus()` wrapped inside a Promise
     *
     * @returns {Promise<void>}
     * @memberof Markov
     */
    addDataAsync(data: MarkovInputData | string[]): Promise<void>;
    /**
     * Generates a result, that contains a string and its references
     *
     * @param {MarkovGenerateOptions} [options={}]
     * @returns {MarkovResult}
     * @memberof Markov
     */
    generate(options?: MarkovGenerateOptions): MarkovResult;
    /**
     * `.generate()` wrapped inside a Promise
     *
     * @param {MarkovGenerateOptions} options
     * @returns {Promise<MarkovResult>}
     * @memberof Markov
     */
    generateAsync(options?: MarkovGenerateOptions): Promise<MarkovResult>;
}
