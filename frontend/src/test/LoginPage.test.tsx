import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

describe('LoginPage Component', () => {
  it('renders login form and enterprise branding', () => {
    renderLoginPage();
    expect(screen.getByText('Secure AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Zero-Trust Enterprise Knowledge & AI Governance')).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText('Role-based access control enforced')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin\s*Control Center/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Manager\s*Team workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Employee\s*Knowledge base/i })).toBeInTheDocument();
  });

  it('renders security assurance indicators', () => {
    renderLoginPage();
    expect(screen.getByText(/AES-256 Encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/RBAC Enforced/i)).toBeInTheDocument();
  });
});
