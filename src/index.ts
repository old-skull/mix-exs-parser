import { Content, Defs, Result } from './interfaces';

/**
 * Match all content between `defmodule\s` and `\sdo`.
 *
 * @param {string} config
 * @returns {string} name of the module
 */
export const getModuleName = (config: string): string => {
  const moduleName: string =
    config.match(/(?<=defmodule )(?:.*)(?= do)/g)?.at(0) || '';

  return moduleName;
};

/**
 * Match lines thats start with `use\s`.
 *
 * @param {string} config
 * @returns {RegExpMatchArray | []} array of `use`
 */
export const getUses = (config: string): RegExpMatchArray | [] => {
  const uses: RegExpMatchArray | [] = config.match(/(?<=use )(?:.*)/g) || [];

  return uses;
};

/**
 * Match all content between `def\s|defp\s` and `,|\sdo` without `,`.
 *
 * @param {string} config
 * @returns {RegExpMatchArray | []} all function names
 */
export const getDefNames = (config: string): RegExpMatchArray | [] => {
  const defNames: RegExpMatchArray | [] =
    config.match(/(?<=(?:def|defp)\s)(.*?[^,])(?=,|\sdo)/g) || [];

  return defNames;
};

/**
 * Match all after `#`.
 *
 * @param {string} config
 * @returns {RegExpMatchArray | []} all single line comments
 */
export const getSingleLineComments = (
  config: string,
): RegExpMatchArray | [] => {
  const singleLineComments: RegExpMatchArray | [] =
    config.match(/#\s.+/g) || [];

  return singleLineComments;
};

/**
 * Match all between `"""` and `"""`.
 *
 * @param {string} config
 * @returns {RegExpMatchArray | []} all multi line comments
 */
export const getMultiLineComments = (config: string): RegExpMatchArray | [] => {
  const multiLineComments: RegExpMatchArray | [] =
    config.match(/"""[\s\S]*"""/g) || [];

  return multiLineComments;
};

/**
 * Match function definition keyword(private and public).
 *
 * Match `def|defp` before `name`.
 *
 * @param {string} config
 * @param {string} defName
 * @returns {string} function keyword associated with function name
 */
export const getDefKeywordByName = (
  config: string,
  defName: string,
): string => {
  const defKeyword: string =
    config
      .match(new RegExp('(?<=\\s+)(def|defp)(?=\\s' + defName + ')'))
      ?.at(0) || '';

  return defKeyword;
};

/**
 * Normalized function names.
 *
 * @param {string} config
 * @returns {string[]} normalized function definitions
 */
export const normalizeDefNames = (config: string): string[] => {
  const defNames = getDefNames(config);

  // Since each function could have an arguments list `(arg, arg2, argN...)` its crucial to escape `(` and `)` symbols.
  const normalizedDefNames: string[] = defNames.map((defName: string) =>
    defName.includes('(') ? defName.replace(/\((.*)\)/, '\\($1\\)') : defName,
  );

  return normalizedDefNames;
};

/**
 * Match lambda-like function or regular function and get its content
 *
 * @param {string} config
 * @param {string} defName function name
 * @returns {string} unparced content of the function
 */
const getRawFunctionContent = (config: string, defName: string): string => {
  const rawContent: string =
    config
      .match(new RegExp('(?<=(?:def|defp)\\s' + defName + '.+do:\\s)(.+)'))
      ?.at(0) ||
    config
      .match(
        new RegExp('(?<=' + defName + '\\sdo\n\\s{4,})(?:[^<]+?)(?=\\s+end)'),
      )
      ?.at(0) ||
    '';

  return rawContent;
};

/**
 * Convert mix.exs to the AST-like object
 * See {@link https://github.com/old-skull/mix-exs-parser GitHub}.
 * @param {string} config - mix.exs file content.
 * @returns {Result} AST-like object
 */
export const parse = (config: string): Result => {
  /**
   * Parsed functions map where `key` = `def_name` and `value` = Def
   *
   * @see [Def](./index.d.ts)
   */
  const defs: Defs = normalizeDefNames(config).reduce(
    (defs: Defs, defName: string) => {
      const rawContent = getRawFunctionContent(config, defName);

      /**
       * Parsed content of the function.
       */
      let content: Partial<Content> = {};

      // match configuration
      if (rawContent.match(/\[\s+.+?:.+/)) {
        // const parsedContent: Record<string, string> = {};

        const normalizedContent: string[] = rawContent
          // remove comments
          .replace(/#.*/g, '')
          // remove new lines and extra spaces
          .replace(/\s+/g, '')
          // remove squre brackets
          .replace(/[\[\]{}]/g, '')
          // split lines
          .split(',')
          // remove empty string etc
          .filter(Boolean);

        const parsedContent = normalizedContent.reduce((parsedContent, str) => {
          // match expressions like `app: app`
          if (!str.match(/.+:.+/)) {
            const keyValue = str.replace(/[""]/g, '');
            parsedContent[keyValue] = keyValue;

            return parsedContent;
          }

          // find first `:`
          const position = str.indexOf(':');
          // get first slice as key and remove extra `semis`
          const key = str.slice(0, position).replace(/[""]/g, '');
          // get second slice as value and remove extra `semis`
          const value = str.slice(position + 1).replace(/[""]/g, '');

          parsedContent[key] = value;

          return parsedContent;
        }, {});

        content = { ...content, ...parsedContent };
      } else {
        content[rawContent] = rawContent;
      }

      defs[defName] = {
        rawContent,
        content,
        isPrivate: getDefKeywordByName(config, defName) === 'defp',
      };

      return defs;
    },
    {},
  );

  const result: Result = {
    moduleName: getModuleName(config),
    uses: getUses(config),
    comments: {
      single: getSingleLineComments(config),
      multi: getMultiLineComments(config),
    },
    defs,
  };

  return result;
};
