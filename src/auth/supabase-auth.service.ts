import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabase/supabase.service';

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private supabaseService: SupabaseService) {}

  // Sign up with Supabase Auth (alternative to existing JWT auth)
  async signUpWithSupabase(email: string, password: string, metadata?: any) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        // Handle rate limiting specifically
        if (
          error.message.includes(
            'For security purposes, you can only request this after',
          )
        ) {
          const match = error.message.match(/after (\d+) seconds?/);
          const waitTime = match ? match[1] : 'a few';
          throw new Error(
            `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          );
        }

        // Handle other potential errors
        if (error.message.includes('User already registered')) {
          throw new Error(
            'An account with this email already exists. Please try logging in instead.',
          );
        }

        throw new Error(`Signup failed: ${error.message}`);
      }

      this.logger.log(`User signed up via Supabase: ${email}`);
      return data;
    } catch (error) {
      this.logger.error('Supabase signup error:', error.message);
      throw error;
    }
  }

  // Sign in with Supabase Auth
  async signInWithSupabase(email: string, password: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Supabase signin failed: ${error.message}`);
      }

      this.logger.log(`User signed in via Supabase: ${email}`);
      return data;
    } catch (error) {
      this.logger.error('Supabase signin error:', error.message);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(`Supabase signout failed: ${error.message}`);
      }

      this.logger.log('User signed out via Supabase');
      return { message: 'Successfully signed out' };
    } catch (error) {
      this.logger.error('Supabase signout error:', error.message);
      throw error;
    }
  }

  // Get current user session
  async getCurrentSession() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(`Failed to get session: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Get session error:', error.message);
      throw error;
    }
  }

  // Refresh session
  async refreshSession() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw new Error(`Failed to refresh session: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Refresh session error:', error.message);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        throw new Error(`Password reset failed: ${error.message}`);
      }

      this.logger.log(`Password reset email sent to: ${email}`);
      return { message: 'Password reset email sent' };
    } catch (error) {
      this.logger.error('Password reset error:', error.message);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(`Password update failed: ${error.message}`);
      }

      this.logger.log('User password updated via Supabase');
      return data;
    } catch (error) {
      this.logger.error('Password update error:', error.message);
      throw error;
    }
  }
}
