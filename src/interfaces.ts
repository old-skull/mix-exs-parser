export interface Content {
  app: string;
  version: string;
  elixir: string;
  start_permanent: string;
  deps: string;
  elixirc_paths: string[];
  extra_applications: string[];
}

export interface Def {
  content: Partial<Content>;
  rawContent: string;
  isPrivate: boolean;
}

export interface Defs {
  [key: string]: Def;
}

export interface Result {
  moduleName: string;
  uses: RegExpMatchArray;
  comments: {
    single: RegExpMatchArray;
    multi: RegExpMatchArray;
  };
  defs: Defs;
}
