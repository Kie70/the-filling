import source from './story.md?raw';

// All narrative text comes from the unabridged supplied manuscript.
const parts = source.trim().split(/^#### /m);
export const storyTitle = parts.shift()!.replace(/^### /, '').trim();
export const chapters = parts.map((part, index) => {
  const newline = part.indexOf('\n');
  const title = part.slice(0, newline).trim();
  return {
    id: `chapter-${index + 1}`,
    number: String(index + 1).padStart(2, '0'),
    title,
    label: index === 2 ? '加害者的强迫症' : title.replace(/^\d+\. /, '').split('：')[0].split('（')[0],
    blocks: part.slice(newline).trim().split(/\n\s*\n/),
  };
});
