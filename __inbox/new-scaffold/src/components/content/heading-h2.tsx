import type { CSSProperties, ReactNode } from 'react';

type Props = {
  id?: string;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
};

export function HeadingH2({ id, children, className, ...rest }: Props) {
  return (
    <h2
      id={id}
      className={`text-subheading font-bold leading-tight pt-vsp-sm border-t-[3px] border-transparent${className ? ` ${className}` : ''}`}
      style={
        {
          borderImage: 'linear-gradient(to right, var(--color-fg), transparent) 1',
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </h2>
  );
}
