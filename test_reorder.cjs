try {
  const motion = require('motion/react');
  console.log(Object.keys(motion).filter(k => k.includes('Reorder')));
} catch (e) {
  console.error(e);
}
