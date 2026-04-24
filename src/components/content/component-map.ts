import { HeadingH2 } from './heading-h2';
import { HeadingH3 } from './heading-h3';
import { HeadingH4 } from './heading-h4';
import { ContentParagraph } from './content-paragraph';
import { ContentLink } from './content-link';
import { ContentStrong } from './content-strong';
import { ContentBlockquote } from './content-blockquote';
import { ContentUl } from './content-ul';
import { ContentOl } from './content-ol';
import { ContentTable } from './content-table';
import { ContentCode } from './content-code';

export const htmlOverrides = {
  h2: HeadingH2,
  h3: HeadingH3,
  h4: HeadingH4,
  p: ContentParagraph,
  a: ContentLink,
  strong: ContentStrong,
  blockquote: ContentBlockquote,
  ul: ContentUl,
  ol: ContentOl,
  table: ContentTable,
  code: ContentCode,
};
