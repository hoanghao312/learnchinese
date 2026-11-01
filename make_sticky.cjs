const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetStr = `  return (
    <div className="space-y-6">
      {/* List Header and Search */}
      <div className="flex flex-col gap-5">`;

const replacement = `  return (
    <div className="flex flex-col relative">
      {/* Sticky Header Section */}
      <div className="sticky top-[68px] z-30 bg-white dark:bg-slate-900 pb-3 pt-1 -mx-4 px-4 md:-mx-6 md:px-6 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-5">`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync('src/components/SavedWordsList.tsx', content);
  console.log('Added sticky start');
} else {
  console.log('Could not find start target');
}
