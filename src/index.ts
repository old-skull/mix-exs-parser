import { Result } from './interfaces';

/**
 * Converts mix.exs to the JSON tokens.
 * See {@link https://github.com/old-skull/mix-exs-parser GitHub}.
 * @param {string} config mix.exs file content.
 * @returns {Result} AST-like json
 */
export const parse = (config: string): Result => {
  /**
   * Match module name.
   *
   * Match all that starts with `defmodule\s` and `\sdo`.
   */
  const moduleName = config.match(/(?<=defmodule )(?:.*)(?= do)/g)?.at(0) ?? null;

  /**
   * Match all uses imports.
   *
   * Match all that starts with `use\s`.
   */
  const uses = config.match(/(?<=use )(?:.*)/g);

  /**
   * Match all def names(public and private).
   *
   * Match all between `def\s|defp\s` and `\sdo`.
   */
  const defNames = config.match(/(?<=(?<=def )|(?<=defp ))(.*)(?= do)/g)?.map(defName => {
    if (defName[defName.length - 1] === ',') {
      defName = defName.slice(0, defName.length - 1);
    }

    if (defName.includes('(')) {
      defName = defName.replace(/\(/, '\\(').replace(/\)/, '\\)');
    }

    return defName;
  });

  const defs =
    defNames?.map(name => {
      /**
       * Match lambda by name
       */
      const lambda =
        config
          .match(
            // prettier-ignore
            new RegExp('(?<='+name+'.+do:\\s)(.+)'),
          )
          ?.at(0) ?? null;

      /**
       * Match def by name
       */
      const def =
        config
          .match(
            // prettier-ignore
            new RegExp('(?<='+name+'\\sdo\n\\s{4,})(?:[^<]+?)(?=\\s+end)'),
          )
          ?.at(0) ?? null;

      /**
       * Unparced content of the function
       */
      const rawContent = lambda || def;

      /**
       * Parced content of the function
       */
      const content = [
        // TODO: parse rawContent
      ];

      /**
       * Match function definition keyword(private and public).
       *
       * Match `def|defp` before `name`.
       */
      const defKeyword =
        config
          .match(
            // prettier-ignore
            new RegExp('(?<=\\s+)(def|defp)(?=\\s'+name+')'),
          )
          ?.at(0) ?? null;

      return {
        name,
        rawContent,
        content,
        isPrivate: defKeyword === 'defp',
      };
    }) ?? null;

  /**
   * Match all single-line comments.
   *
   * Match all after `#`.
   */
  const singleLineComments = config.match(/#.*/g);

  /**
   * Match all multi-line comments.
   * Match all between `"""` and `"""`.
   */
  const multiLineComments = config.match(/"""[\s\S]*"""/g);

  const result = {
    moduleName,
    uses,
    comments: {
      single: singleLineComments,
      multi: multiLineComments,
    },
    defs,
  };

  return result as any;
};
