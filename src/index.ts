import { Content, Defs, Result } from './interfaces';

/**
 * Convert mix.exs to the AST-like object
 * See {@link https://github.com/old-skull/mix-exs-parser GitHub}.
 * @param {string} config - mix.exs file content.
 * @returns {Result} - AST-like object
 */
export const parse = (config: string): Result => {
  /**
   * Match module name.
   *
   * Match all that starts with `defmodule\s` and `\sdo`.
   */
  const moduleName: string =
    config.match(/(?<=defmodule )(?:.*)(?= do)/g)?.at(0) || '';

  /**
   * Match all uses imports.
   *
   * Match all that starts with `use\s`.
   */
  const uses = config.match(/(?<=use )(?:.*)/g) || [];

  /**
   * Match all def names(public and private).
   *
   * Match all between `def\s|defp\s` and `,|\sdo` without `,`.
   */
  const defNames =
    config.match(/(?<=(?:def|defp)\s)(.*?[^,])(?=,|\sdo)/g) || [];

  /**
   * Normalized function names.
   *
   * Since each function could have an arguments like `(arg, arg2)` its crucial to escape `(` and `)` symbols.
   */
  const normalizedDefNames: string[] = defNames.map(defName =>
    defName.includes('(') ? defName.replace(/\((.*)\)/, '\\($1\\)') : defName,
  );

  /**
   * Parsed functions map where `key` = `def_name` and `value` = Def
   *
   * @see [Def](./index.d.ts)
   */
  const defs: Defs = {};
  normalizedDefNames.forEach(defName => {
    /**
     * Unparced content of the function.
     *
     * Match lambda-like function or regular function.
     */
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

    /**
     * Parsed content of the function.
     */
    let content: Partial<Content> = {};

    // match configuration
    if (rawContent.match(/\[\s+.+?:.+/)) {
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

      const parsedContent: Record<string, string> = {};

      normalizedContent.forEach(str => {
        // match expressions like `app: app`
        if (!str.match(/.+:.+/)) {
          const keyValue = str.replace(/[""]/g, '');
          parsedContent[keyValue] = keyValue;

          return;
        }

        // find first `:`
        const pos = str.indexOf(':');
        // get first slice as key and remove extra `semis`
        const key = str.slice(0, pos).replace(/[""]/g, '');
        // get second slice as value and remove extra `semis`
        const value = str.slice(pos + 1).replace(/[""]/g, '');

        parsedContent[key] = value;
      });

      content = { ...content, ...parsedContent };
    } else {
      content[rawContent] = rawContent;
    }

    /**
     * Match function definition keyword(private and public).
     *
     * Match `def|defp` before `name`.
     */
    const defKeyword: string =
      config
        .match(new RegExp('(?<=\\s+)(def|defp)(?=\\s' + defName + ')'))
        ?.at(0) || '';

    defs[defName] = {
      rawContent,
      content,
      isPrivate: defKeyword === 'defp',
    };
  });

  /**
   * Match all single-line comments.
   *
   * Match all after `#`.
   */
  const singleLineComments = config.match(/#\s.+/g) || [];

  /**
   * Match all multi-line comments.
   *
   * Match all between `"""` and `"""`.
   */
  const multiLineComments = config.match(/"""[\s\S]*"""/g) || [];

  const result: Result = {
    moduleName,
    uses,
    comments: {
      single: singleLineComments,
      multi: multiLineComments,
    },
    defs,
  };

  return result;
};
