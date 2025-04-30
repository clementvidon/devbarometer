import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Report from './Report';

describe('Report component', () => {
  it('renders loading message', () => {
    render(<Report />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<Report />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Report',
    );
  });
});
