import { pinyin } from 'pinyin-pro';
import slugify from 'slugify';

export function generateSlug(title: string): string {
  return (
    slugify(
      pinyin(title, {
        toneType: 'none',
        type: 'array',
        nonZh: 'consecutive',
      }).join(' '),
      { lower: true, strict: true },
    ) +
    '-' +
    Date.now()
  );
}
