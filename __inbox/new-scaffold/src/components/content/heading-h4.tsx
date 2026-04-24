import type { CSSProperties, ReactNode } from 'react';

type Props = {
  id?: string;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
};

export function HeadingH4({ id, children, className, ...rest }: Props) {
  return (
    <h4
      id={id}
      className={`text-body font-semibold leading-snug pt-vsp-xs border-t border-transparent${className ? ` ${className}` : ''}`}
      style={
        {
          borderImage: 'linear-gradient(to right, var(--color-muted), transparent) 1',
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </h4>
  );
}
