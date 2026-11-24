source "https://rubygems.org"

# Web běží na GitHub Pages, které si web sestavuje samo. Gem "github-pages"
# drží lokálně stejné verze Jekyllu a pluginů jako produkce.
#
#     bundle install
#     bundle exec jekyll serve
#
gem "github-pages", group: :jekyll_plugins

# Lokální `jekyll serve` na Ruby 3+
gem "webrick", "~> 1.8"
# Windows nemá zoneinfo, proto tzinfo-data
gem "tzinfo-data", platforms: [:windows, :jruby]
gem "wdm", "~> 0.1", platforms: [:windows]
