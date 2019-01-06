# aframe-markdown

Renders Markdown using SDF text in a-frame.

## Properties

|Properties|Description|Default Value|
|-|-|-|
|src|The source for the markdown to render. Either the actual markdown text, or a selector to an a-asset-item that
loads the markdown||
|wrapCount|Number of characters before wrapping text (more or less).|40|
|padding|Padding in meters between the background and the text|0.05|

## Supported Markdown Features

aframe-markdown supports a basic subset of markdown.

- [x] Paragraphs
  - [x] Line breaks
- [x] Headers
- [x] Images
- [x] Lists
  - [x] Nested lists
  - [x] Unordered lists
  - [x] Ordered lists
- [ ] Inline bold and italic formatting
- [ ] Blockquotes
- [ ] Horizontal rules
- [ ] Tables
- [ ] Code
  - [ ] Inline code
  - [ ] Code blocks
- [ ] Links

## How it works

aframe-markdown uses a hidden div and marked.js to render the markdown in the background and then re-creates the 
rendered in a-frame using the HTML's metrics.
