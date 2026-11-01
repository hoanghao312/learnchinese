const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const rehypeRaw = require('rehype-raw').default || require('rehype-raw');

const markdown1 = '**hello**';
const markdown2 = '**<span>hello</span>**';
const markdown3 = '**<span style="color:red">hello</span>**';

console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown1 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown2 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown3 })));
