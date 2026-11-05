import { View, type ViewProps } from 'react-native';

/** 1px outline, no shadow. Use only when grouping genuinely helps. */
export function Card({ className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`gap-4 rounded-[10px] border border-line bg-surface p-4 ${className}`}
      {...props}
    />
  );
}
