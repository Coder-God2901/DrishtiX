import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { OAuthButtonGroup, OAuthDivider } from '@/components/auth/OAuthButton';
import { firebaseService } from '@/services/firebase.service';
import { Eye, EyeOff, Shield, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loginWithGoogle, loginWithFacebook, loginWithGithub, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    document.title = 'Login - EventSphere';
    clearError();

    // Check for redirect result on mount
    const handleRedirectResult = async () => {
      try {
        const result = await firebaseService.handleRedirectResult();
        if (result && result.user) {
          const idToken = await result.user.getIdToken();
          await loginWithGoogle(idToken);
          toast.success('Successfully signed in with Google!');
          navigate(from, { replace: true });
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        if (err.message && !err.message.includes('No redirect')) {
          toast.error(err.message);
        }
      }
    };

    handleRedirectResult();
  }, [clearError, from, navigate, loginWithGoogle]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by store and toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await firebaseService.signInWithGoogle(false);
      if (user) {
        const idToken = await user.getIdToken();
        await loginWithGoogle(idToken);
        toast.success('Successfully signed in with Google!');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const user = await firebaseService.signInWithFacebook(false);
      if (user) {
        const accessToken = await user.getIdToken();
        await loginWithFacebook(accessToken);
        toast.success('Successfully signed in with Facebook!');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Facebook sign-in failed');
    }
  };

  const handleGithubLogin = async () => {
    try {
      const user = await firebaseService.signInWithGithub(false);
      if (user) {
        const accessToken = await user.getIdToken();
        await loginWithGithub(accessToken);
        toast.success('Successfully signed in with GitHub!');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'GitHub sign-in failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with enhanced styling */}
      <div className="space-y-3 text-center relative">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl"></div>
            <Shield className="w-16 h-16 text-primary relative" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Sign in to access your intelligent event management dashboard
        </p>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <Zap className="w-3 h-3" />
            <span>Real-time</span>
          </div>
        </div>
      </div>

      {/* OAuth Login Options */}
      <div className="space-y-4">
        <OAuthButtonGroup
          onGoogleClick={handleGoogleLogin}
          onFacebookClick={handleFacebookLogin}
          onGithubClick={handleGithubLogin}
          providers={['google', 'github', 'facebook']}
          layout="vertical"
          size="default"
        />
      </div>

      <OAuthDivider />

      {/* Traditional Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@eventsphere.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        <Button
          type="submit"
          className={cn(
            'w-full h-11 font-medium transition-all duration-200',
            'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90',
            'shadow-lg hover:shadow-xl'
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* Sign up link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link to="/auth/register" className="text-primary hover:underline font-medium transition-colors">
          Sign up for free
        </Link>
      </div>

      {/* Demo credentials with enhanced styling */}
      <div className="rounded-lg bg-gradient-to-br from-muted/50 to-muted border border-border p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <p className="font-semibold text-foreground">Demo Credentials</p>
        </div>
        <div className="space-y-1 text-muted-foreground pl-4">
          <p className="font-mono text-xs">
            <span className="text-foreground/70">Email:</span> admin@eventsphere.com
          </p>
          <p className="font-mono text-xs">
            <span className="text-foreground/70">Password:</span> any password
          </p>
        </div>
        <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/50">
          For testing purposes only. Use OAuth for production accounts.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Your connection is secured with end-to-end encryption. We use industry-standard security practices to protect
          your data.
        </p>
      </div>
    </div>
  );
}
