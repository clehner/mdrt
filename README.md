mdrt
====

Experimental markdown preview app written in node and netbeans protocol for vim.

## Basic Usage

First start mdrt
``sh
$ node mdrt.js ~/path/to/file.md
``
Point browser to address http://127.0.0.1:9090/

Then open vim and connect to mdrt: `:nbs`

Start typing and you should see result in the browser
