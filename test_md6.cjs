const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const rehypeRaw = require('rehype-raw').default || require('rehype-raw');

const markdown1 = '今天**hello**。';
const markdown2 = '今天**星期一**。';
const markdown3 = '今天**<span style="color:red;">hello</span>**。';
const markdown4 = '今天**<span style="color:red;">星期一</span>**。';

console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown1 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown2 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown3 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown4 })));
