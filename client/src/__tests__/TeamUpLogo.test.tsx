import React from 'react';
import { render } from '@testing-library/react-native';
import { TeamUpLogo } from '../components/TeamUpLogo';

describe('TeamUpLogo', () => {
  it('renders default gradient logo with size 24', () => {
    const { toJSON } = render(<TeamUpLogo />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom size and custom solid color', () => {
    const { toJSON } = render(<TeamUpLogo size={48} color="#FAFAFA" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with secondaryColor and custom dimensions', () => {
    const { toJSON } = render(
      <TeamUpLogo size={32} color="#6366F1" secondaryColor="#14B8A6" useGradient={false} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
