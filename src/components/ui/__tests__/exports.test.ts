import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Alert, AlertDescription } from '../alert';
import { Badge } from '../badge';

describe('UI Component Exports', () => {
  it('should export Card components', () => {
    expect(Card).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardDescription).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
  });

  it('should export Button component', () => {
    expect(Button).toBeDefined();
  });

  it('should export Alert components', () => {
    expect(Alert).toBeDefined();
    expect(AlertDescription).toBeDefined();
  });

  it('should export Badge component', () => {
    expect(Badge).toBeDefined();
  });

  it('should have proper display names', () => {
    expect(Card.displayName).toBe('Card');
    expect(Button.displayName).toBe('Button');
    expect(Alert.displayName).toBe('Alert');
    expect(Badge.displayName).toBe('Badge');
  });
}); 