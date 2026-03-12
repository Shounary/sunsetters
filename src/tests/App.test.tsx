// src/App.test.tsx
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import App from '../App';

// MOCK AWS AMPLIFY AUTH
vi.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => ({
    user: { userId: 'mock-user-123' },
    signOut: vi.fn(), // Creates a dummy function we can track
  }),
}));

// MOCK AWS AMPLIFY STORAGE
vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn().mockResolvedValue({ url: 'https://fake-image-url.com/sunset.jpg' }),
  uploadData: vi.fn(),
  remove: vi.fn(),
}));

// MOCK AWS AMPLIFY DATA (DynamoDB)
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      UserPost: {
        observeQuery: () => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      UserProfile: {
        observeQuery: () => ({
          // When the component mounts, simulate an empty profile returning
          subscribe: (callbacks: any) => {
            callbacks.next({ items: [] });
            return { unsubscribe: vi.fn() };
          }
        }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      FeedPost: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      Post: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      }
    },
    queries: {
      sunsetAnalyzer: vi.fn(),
    },
    mutations: {
      checkRateLimit: vi.fn(),
      userEvent: vi.fn(),
    }
  }),
}));

describe('SunSetters App Component', () => {
  // Clear any mock history before each test runs
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main application header correctly', () => {
    render(<App />);

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Setters')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
  });

  it('renders the create post form', () => {
    render(<App />);
    
    expect(screen.getByPlaceholderText('Have you seen a sunset?')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
  });

  it('updates the text input when a user types a caption', () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Have you seen a sunset?');

    fireEvent.change(input, { target: { value: 'SFO' } });

    expect(input).toHaveValue('SFO');
  });

  it('does not attempt to post if no image is attached', async () => {
    const mockClient = generateClient() as any;
    
    render(<App />);
    
    const postButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(postButton);

    expect(mockClient.mutations.checkRateLimit).not.toHaveBeenCalled();
  });
});