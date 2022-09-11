/**
 * Converts mix.exs to the JSON tokens.
 * See {@link https://github.com/old-skull/mix-exs-parser GitHub}.
 * @param {string} config mix.exs file content.
 * @param {boolean} [generateJson=true] whether the result should be written to JSON.
 * @returns {JSON} a compressed version of the JSON.
 */
export const parser = (config: string, generateJson: boolean = true): string => {
  // TODO: parse config
  console.log(config);

  if (generateJson) {
    // generate mix.exs.json
  }

  // return string representation of the json
  return JSON.stringify({});
};
