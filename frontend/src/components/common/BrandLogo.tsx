import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
}) => (
  <img
    src="/carni-logo.png"
    alt="CARNI"
    className={`block object-contain ${className}`}
  />
);
