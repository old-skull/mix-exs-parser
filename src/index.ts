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
  const uses: RegExpMatchArray = config.match(/(?<=use )(?:.*)/g) || [];

  /**
   * Match all def names(public and private).
   *
   * Match all between `def\s|defp\s` and `,|\sdo` without `,`.
   */
  const defNames: RegExpMatchArray =
    config.match(/(?<=(?:def|defp)\s)(.*[^,])(?=,|\sdo)/g) || [];

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
      const normalizedContent = rawContent
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

      const parsedContent = {};

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
  const singleLineComments: RegExpMatchArray = config.match(/#.*/g) || [];

  /**
   * Match all multi-line comments.
   *
   * Match all between `"""` and `"""`.
   */
  const multiLineComments: RegExpMatchArray =
    config.match(/"""[\s\S]*"""/g) || [];

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

parse(`defmodule App.MixProject do
  use Mix.Project
  use Mix.Env

  defp description do
    """
    Multiline comment as description of the application
    """
  end

  defp extra_applications(_), do: [:logger]
  defp extra_applications(:test), do: [:stream_data | extra_applications(123)]

  def project do
    [
      app: :app,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    # Run "mix help compile.app" to learn about applications.
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:dep_from_hexpm, "~> 0.3.0"},
      {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"}
    ]
  end
end`);
