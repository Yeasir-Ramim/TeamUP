import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface TeamUpLogoProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  useGradient?: boolean;
}

/**
 * TeamUp Brand Logo (SVG)
 *
 * Design Symbolism:
 * - "T" & "U" Monogram: The broad shoulders and center axis form the "T", while the bottom cradle forms the "U".
 * - Collaborative Dual Pillars: The left and right geometric halves represent two distinct teammates uniting their skills.
 * - Upward Arrow / Ascension: The converging angled peaks form an upward arrowhead ("Up"), symbolizing team momentum, growth, and project launch.
 */
export const TeamUpLogo: React.FC<TeamUpLogoProps> = ({
  size = 24,
  color,
  secondaryColor,
  useGradient = true,
}) => {
  const gradientIdLeft = 'teamup-grad-left';
  const gradientIdRight = 'teamup-grad-right';

  const leftFill = color ? color : useGradient ? `url(#${gradientIdLeft})` : '#6366F1';
  const rightFill = secondaryColor
    ? secondaryColor
    : color
    ? color
    : useGradient
    ? `url(#${gradientIdRight})`
    : '#818CF8';

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {useGradient && !color && (
        <Defs>
          <LinearGradient id={gradientIdLeft} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366F1" />
            <Stop offset="100%" stopColor="#4F46E5" />
          </LinearGradient>
          <LinearGradient id={gradientIdRight} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#6366F1" />
          </LinearGradient>
        </Defs>
      )}
      {/* Left Teammate Pillar */}
      <Path
        d="M14.5 5.2C14.5 4.4 13.6 4.0 13.0 4.6L4.4 13.2C3.8 13.8 4.2 14.8 5.1 14.8H10.5V22C10.5 24.8 12.3 27 14.5 27V5.2Z"
        fill={leftFill}
      />
      {/* Right Teammate Pillar */}
      <Path
        d="M17.5 5.2C17.5 4.4 18.4 4.0 19.0 4.6L27.6 13.2C28.2 13.8 27.8 14.8 26.9 14.8H21.5V22C21.5 24.8 19.7 27 17.5 27V5.2Z"
        fill={rightFill}
      />
    </Svg>
  );
};
