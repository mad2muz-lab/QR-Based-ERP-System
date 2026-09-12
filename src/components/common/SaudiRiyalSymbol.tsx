import React from 'react';

interface SaudiRiyalSymbolProps {
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

/**
 * Official New Saudi Riyal (SAR) Symbol Component
 * Based on the official design: https://github.com/abdulrysrr/new-saudi-riyal-symbol
 */
export const SaudiRiyalSymbol: React.FC<SaudiRiyalSymbolProps> = ({
  className = '',
  size = '1em',
  style = {},
}) => {
  return (
    <svg
      viewBox="0 0 1124.14 1256.39"
      width={size}
      height={size}
      fill="currentColor"
      aria-label="SAR"
      role="img"
      className={`inline-block align-middle transition-colors ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.15em',
        flexShrink: 0,
        ...style,
      }}
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  );
};

interface CurrencyDisplayProps {
  amount: number | string;
  decimals?: number;
  className?: string;
  symbolClassName?: string;
  symbolSize?: number | string;
  prefix?: string;
  suffix?: string;
}

/**
 * CurrencyDisplay helper to format and show amount with the new Saudi Riyal symbol
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  decimals = 2,
  className = '',
  symbolClassName = '',
  symbolSize = '0.9em',
  prefix,
  suffix,
}) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const formatted = numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`inline-flex items-center gap-1 font-inherit ${className}`}>
      {prefix && <span>{prefix}</span>}
      <SaudiRiyalSymbol size={symbolSize} className={symbolClassName} />
      <span>{formatted}</span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

export default SaudiRiyalSymbol;
