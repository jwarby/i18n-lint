declare module 'i18n-lint' {
  export type Options = {
    /** List of which HTML attributes should be checked */
    attributes: string[];
    /** list of HTML tags to ignore when searching for hardcoded strings */
    ignoreTags: string[];
    templateDelimiters: Array<[string, string]>;
  };
  export type ErrorCode = 'W001' | 'W002';
  export type Error = {
    /** usually '(error)' */
    id: string;
    /** warning code */
    code: ErrorCode;
    /** message describing the error */
    reason: string;
    /** with the offending text in match groups */
    evidence: RegExp;
    /** The offending text */
    text: string;
    /** line number of the error */
    line: number;
    /** column where evidence begins */
    character: number;
    /** where the error was found */
    scope: string;
    /** Whether the error is continued in multiple lines */
    continued: boolean
  };
  export type Reporter = (errors: Error[]) => void;
  /**
   * Scan a file for untranslatable strings.
   * @param file     File name
   * @param options  Options for linting
   *
   * @return an array of error objects
   */
  function I18nLint(file: string, options: Partial<Options>): Error[];
  namespace I18nLint {
    /**
     * Scan a portion of text for untranslatable strings.
     * @param lines   The text to scan
     * @param options The scanning options
     *
     * @return an array of error objects
     */
    function scan(lines: string, options: Partial<Options>): Error[];
    const reporters: {
      [name: string]: Reporter;
    };
  }
  export default I18nLint;
}
