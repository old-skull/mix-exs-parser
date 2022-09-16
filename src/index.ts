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
  const moduleName: string = config.match(/(?<=defmodule )(?:.*)(?= do)/g)?.at(0) || '';

  /**
   * Match all uses imports.
   *
   * Match all that starts with `use\s`.
   */
  const uses: RegExpMatchArray = config.match(/(?<=use )(?:.*)/g) || [];

  /**
   * Match all def names(public and private).
   *
   * Match all between `def\s|defp\s` and `\sdo`.
   */
  const defNames: RegExpMatchArray = config.match(/(?<=(?<=def )|(?<=defp ))(.*)(?= do)/g) || [];

  /**
   * Normalized function names.
   *
   * Since each function could have an arguments like `(arg, arg2)` its crucial to escape `(` and `)` symbols.
   *
   * And also, due to regex, there is an extra comma at the end of lambda.
   */
  const normalizedDefNames: string[] = defNames.map(defName => {
    if (defName.includes('(')) {
      defName = defName.replace(/\((.*)\)/, '\\($1\\)');
    }

    // HACK: update defNames to avoid comma and extra check
    if (defName[defName.length - 1] === ',') {
      defName = defName.slice(0, defName.length - 1);
    }

    return defName;
  });

  /**
   * Parsed functions map where `key` = `def_name` and `value` = Def
   *
   * @see [Def](./index.d.ts)
   */
  const defs: Defs = {};
  normalizedDefNames.forEach(name => {
    /**
     * Unparced content of the function.
     *
     * Match lambda-like function or regular function.
     */
    const rawContent: string =
      config
        .match(
          // prettier-ignore
          new RegExp('(?<=(?:def|defp)\s'+name+'.+do:\s)(.+)'),
        )
        ?.at(0) ||
      config
        .match(
          // prettier-ignore
          new RegExp('(?<='+name+'\\sdo\n\\s{4,})(?:[^<]+?)(?=\\s+end)'),
        )
        ?.at(0) ||
      '';

    /**
     * Parsed content of the function.
     */
    const content: Partial<Content> = {}; // TODO: parse rawContent

    /**
     * Match function definition keyword(private and public).
     *
     * Match `def|defp` before `name`.
     */
    const defKeyword: string =
      config
        .match(
          // prettier-ignore
          new RegExp('(?<=\\s+)(def|defp)(?=\\s'+name+')'),
        )
        ?.at(0) || '';

    defs[name] = {
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
  const singleLineComments: RegExpMatchArray = config.match(/#.*/g) || [];

  /**
   * Match all multi-line comments.
   * Match all between `"""` and `"""`.
   */
  const multiLineComments: RegExpMatchArray = config.match(/"""[\s\S]*"""/g) || [];

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
