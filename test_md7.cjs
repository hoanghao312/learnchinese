const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const rehypeRaw = require('rehype-raw').default || require('rehype-raw');

console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: 'a**b**c' })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: 'a**<span>b</span>**c' })));
