import { parse } from '@old-skull/mix-exs-parser';
import { editor } from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import './style.scss';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }

    return new editorWorker();
  },
};

const sharedConfig: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  theme: 'vs-dark',
  wordWrap: 'on',
  fontLigatures: 'true',
  tabSize: 2,
  fontSize: 15,
  renderWhitespace: 'boundary',
  formatOnPaste: true,
  formatOnType: true,
};

const elixirEditor = editor.create(
  document.getElementById('elixir-editor') as HTMLElement,
  {
    value: `defmodule App.MixProject do
  use Mix.Project

  def project do
    [
      app: :app,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      # {:dep_from_hexpm, "~> 0.3.0"},
      # {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"}
    ]
  end
end
`,
    language: 'elixir',
    ...sharedConfig,
  },
);

const jsonEditor = editor.create(
  document.getElementById('json-editor') as HTMLElement,
  {
    value: JSON.stringify(
      {
        moduleName: 'App.MixProject',
        uses: ['Mix.Project'],
        comments: {
          single: [
            '# Run "mix help compile.app" to learn about applications.',
            '# Run "mix help deps" to learn about dependencies.',
            '# {:dep_from_hexpm, "~> 0.3.0"},',
            '# {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"}',
          ],
          multi: [],
        },
        defs: {
          project: {
            rawContent:
              '[\n      app: :app,\n      version: "0.1.0",\n      elixir: "~> 1.13",\n      start_permanent: Mix.env() == :prod,\n      deps: deps()\n    ]',
            content: {
              app: ':app',
              version: '0.1.0',
              elixir: '~>1.13',
              start_permanent: 'Mix.env()==:prod',
              deps: 'deps()',
            },
            isPrivate: false,
          },
          application: {
            rawContent: '[\n      extra_applications: [:logger]\n    ]',
            content: {
              extra_applications: ':logger',
            },
            isPrivate: false,
          },
          deps: {
            rawContent:
              '[\n      # {:dep_from_hexpm, "~> 0.3.0"},\n      # {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"}\n    ]',
            content: {},
            isPrivate: true,
          },
        },
      },
      null,
      2,
    ),
    language: 'json',
    ...sharedConfig,
  },
);

document.querySelector('.ctrl-clear')?.addEventListener('click', () => {
  elixirEditor.setValue('');
  jsonEditor.setValue('');
});

document.querySelector('.ctrl-convert')?.addEventListener('click', () => {
  const elixirCode = elixirEditor.getValue();
  const newJson = parse(elixirCode);
  jsonEditor.setValue(JSON.stringify(newJson, null, 2));
});

document.querySelector('.ctrl-copy')?.addEventListener('click', () => {
  const json = jsonEditor.getValue();
  navigator.clipboard.writeText(json);

  const snackbar = document.querySelector('#snackbar') as HTMLElement;
  snackbar.className = 'show';

  setTimeout(() => (snackbar.className = ''), 1000);
});
