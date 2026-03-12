import { render, screen, fireEvent } from '@testing-library/react';
import NavigationBar from '../NavigationBar';

describe('NavigationBar Component', () => {
  const mockTabs = ["Feed", "My Posts", "Follows"];
  
  it('renders all provided tabs', () => {
    render(
      <NavigationBar 
        tabs={mockTabs} 
        activeTab="Feed" 
        onTabChange={() => {}} 
      />
    );

    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('My Posts')).toBeInTheDocument();
    expect(screen.getByText('Follows')).toBeInTheDocument();
  });

  it('calls onTabChange when a new tab is clicked', () => {
    const handleTabChange = vi.fn();

    render(
      <NavigationBar 
        tabs={mockTabs} 
        activeTab="Feed" 
        onTabChange={handleTabChange} 
      />
    );

    const followsButton = screen.getByText('Follows');
    fireEvent.click(followsButton);

    expect(handleTabChange).toHaveBeenCalledWith('Follows');
    expect(handleTabChange).toHaveBeenCalledTimes(1);
  });
});