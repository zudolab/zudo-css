type Props = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
};

export function ContentStrong({ children, className, ...rest }: Props) {
  return (
    <strong
      className={`font-bold text-fg${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </strong>
  );
}
