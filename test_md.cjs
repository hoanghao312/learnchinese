const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const rehypeRaw = require('rehype-raw').default || require('rehype-raw');
const remarkGfm = require('remark-gfm').default || require('remark-gfm');

const markdown = '今天**<span style="color:red;">星期一</span>，<span style="color:red;">天气很好</span>**。我的**<span style="color:red;">先生</span>**是医生，他很**<span style="color:red;">忙</span>**。他**喜欢喝茶**。';

const element = React.createElement(ReactMarkdown, {
  rehypePlugins: [rehypeRaw],
  remarkPlugins: [remarkGfm],
  children: markdown
});

console.log(renderToStaticMarkup(element));
