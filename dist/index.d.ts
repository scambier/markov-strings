export declare type MarkovGenerateOptions = {
    maxTries?: number;
    filter?: (result: MarkovResult) => boolean;
};
export declare type MarkovConstructorOptions = {
    stateSize?: number;
};
export declare type MarkovResult = {
    string: string;
    score: number;
    refs: Array<{
        string: string;
    }>;
    tries: number;
};
export declare type MarkovFragment = {
    words: string;
    refs: Array<{
        string: string;
    }>;
};
export declare type Corpus = {
    [key: string]: MarkovFragment[];
};
export default class Markov {
    data: Array<{
        string: string;
    }>;
    startWords: MarkovFragment[];
    endWords: MarkovFragment[];
    corpus: Corpus;
    options: MarkovConstructorOptions;
    private defaultOptions;
    /**
     * Creates an instance of Markov generator.
     *
     * @param {(string[] | Array<{ string: string }>)} data An array of strings or objects.
     * If 'data' is an array of objects, each object must have a 'string' attribute
     * @param {MarkovConstructorOptions} [options={}]
     * @memberof Markov
     */
    constructor(data: string[] | Array<{
        string: string;
    }>, options?: MarkovConstructorOptions);
    /**
     * Builds the corpus. You must call this before generating sentences.
     *
     * @memberof Markov
     */
    buildCorpus(): void;
    /**
     * `.buildCorpus()` wrapped inside a Promise
     *
     * @returns {Promise<void>}
     * @memberof Markov
     */
    buildCorpusAsync(): Promise<void>;
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
