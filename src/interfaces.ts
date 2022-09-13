export interface Content {
  app: string;
  version: string;
  elixir: string;
  start_permanent: string;
  deps: string;
  elixirc_paths: string[];
  extra_applications: string[];
  dep_from_hexpm: string;
  dep_from_git: string;
}

export interface Def {
  name: string;
  content: Content;
  rawContent: string;
  isPrivate: boolean;
}

export interface Result {
  moduleName: string;
  uses: string[];
  defs: Def[];
  comments: {
    single: string[];
    multi: string[];
  };
}
