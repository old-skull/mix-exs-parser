defmodule App.MixProject do
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
      # {:dep_from_hexpm, "~> 0.3.0"},
      # {:dep_from_git, git: "https://github.com/elixir-lang/my_dep.git", tag: "0.1.0"}
    ]
  end
end
