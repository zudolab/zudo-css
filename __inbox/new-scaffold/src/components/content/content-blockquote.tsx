type Props = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
};

export function ContentBlockquote({ children, className, ...rest }: Props) {
  return (
    <blockquote
      className={`border-l-[3px] border-muted pl-hsp-lg text-muted italic${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </blockquote>
  );
}
