const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');

const markdown = '今天**星期一**。我的**先生**是医生。';
const element = React.createElement(ReactMarkdown, {
  children: markdown
});

console.log(renderToStaticMarkup(element));
