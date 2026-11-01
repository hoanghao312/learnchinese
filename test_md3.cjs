const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');

const markdown = '我的****先生是医生';
const markdown2 = '我的** 先生 **是医生';
const markdown3 = '我的**先生**是医生';

console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { children: markdown })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { children: markdown2 })));
console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { children: markdown3 })));
