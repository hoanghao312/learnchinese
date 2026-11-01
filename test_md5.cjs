const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const rehypeRaw = require('rehype-raw').default || require('rehype-raw');

const markdown = '今天**<span style="color:red;">星期一</span>，<span style="color:red;">天气很好</span>**。我的****<span style="color:red;">先生</span>是<span style="color:red;">医生</span>，他很****<span style="color:red;">忙</span>。';

console.log(renderToStaticMarkup(React.createElement(ReactMarkdown, { rehypePlugins: [rehypeRaw], children: markdown })));
