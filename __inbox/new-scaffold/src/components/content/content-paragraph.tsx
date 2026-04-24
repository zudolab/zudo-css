type Props = {
  children?: React.ReactNode;
  [key: string]: any;
};

// Passthrough: no custom styles needed for <p> (inherits from .zd-content base).
// Override claimed to enable future Tailwind utilities without CSS cascade conflicts.
export function ContentParagraph({ children, ...rest }: Props) {
  return <p {...rest}>{children}</p>;
}
