# Configuration file for the Sphinx documentation builder.
# https://www.sphinx-doc.org/en/master/usage/configuration.html

import os
import sys

project = 'Support-Engine'
copyright = '2025, NorthByte.io'
author = 'NorthByte.io'
release = '0.1.1'
version = '0.1.1'

extensions = [
    'myst_parser',
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx_copybutton',
    'sphinx_tabs.tabs',
]

myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'tasklist',
    'fieldlist',
    'html_admonition',
    'html_image',
    'smartquotes',
    'strikethrough',
    'substitution',
]

myst_heading_anchors = 3

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

language = 'de'

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

html_theme_options = {
    'logo_only': False,
    'display_version': True,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': True,
    'style_nav_header_background': '#2980B9',
    'collapse_navigation': False,
    'sticky_navigation': True,
    'navigation_depth': 4,
    'includehidden': True,
    'titles_only': False
}

html_context = {
    'display_github': True,
    'github_user': 'northbyte-io',
    'github_repo': 'Support-Engine',
    'github_version': 'main',
    'conf_py_path': '/docs/',
}

html_show_sourcelink = True
html_show_sphinx = False
html_show_copyright = True

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

master_doc = 'index'
