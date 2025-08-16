import { render, screen } from '@testing-library/react';
import LinkList from './LinkList';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          then: jest.fn((cb) => cb({ data: [{ id: 'some-id', ordered_categories: [] }], error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          then: jest.fn((cb) => cb({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          then: jest.fn((cb) => cb({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>, // Mock Link component
}));

// Mock @hello-pangea/dnd as it's a UI library and complex to test directly
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children(
    { droppableProps: {}, innerRef: jest.fn() },
    {}
  ),
  Draggable: ({ children }) => children(
    { draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() },
    {}
  ),
}));

// Mock ExportContext
jest.mock('../contexts/ExportContext', () => ({
  useExport: () => ({
    registerExportFunction: jest.fn(),
    unregisterExportFunction: jest.fn(),
  }),
}));


describe('LinkList', () => {
  const mockLinks = [
    { id: 1, title: 'Test Link 1', url: 'http://test1.com', category: 'Category A', author: 'User1' },
    { id: 2, title: 'Test Link 2', url: 'http://test2.com', category: 'Category B', author: 'User2' },
  ];
  const mockOnDelete = jest.fn();
  const mockOnLinksUpdated = jest.fn();

  it('renders without crashing', () => {
    render(
      <LinkList 
        links={mockLinks} 
        onDelete={mockOnDelete} 
        onLinksUpdated={mockOnLinksUpdated} 
      />
    );
    expect(screen.getByText('Category A')).toBeInTheDocument();
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
  });

  // More tests will go here
});