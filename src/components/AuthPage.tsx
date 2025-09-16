import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AuthPageProps {
  onSuccess: (userId: string, role: string) => void;
}

const AuthPage = ({ onSuccess }: AuthPageProps) => {
  const { signIn, signUp, signInWithOTP, getUserRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    phone: '',
    role: ''
  });

  const [otpForm, setOtpForm] = useState({
    phone: '',
    otp: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      const { role } = await getUserRole(data.user.id);
      if (role) {
        onSuccess(data.user.id, role);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      } else {
        throw new Error('User role not found');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signUp(
        signupForm.email, 
        signupForm.password, 
        signupForm.phone, 
        signupForm.role
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Account created! Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signInWithOTP(otpForm.phone, otpForm.otp);
      
      if (error) throw error;
      if (!data?.user) throw new Error('Invalid OTP');

      const { role } = await getUserRole(data.user.id);
      if (role) {
        onSuccess(data.user.id, role);
        toast({
          title: "Success",
          description: "Logged in with OTP successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AyuSetu</CardTitle>
          <CardDescription>Traceability System</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="otp">Dev OTP</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={signupForm.role} onValueChange={(value) => setSignupForm({...signupForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggregator">Aggregator</SelectItem>
                      <SelectItem value="processor">Processor</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="otp">
              <form onSubmit={handleOTPLogin} className="space-y-4">
                <div>
                  <Label htmlFor="otp-phone">Phone (Dev)</Label>
                  <Select value={otpForm.phone} onValueChange={(value) => setOtpForm({...otpForm, phone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dev phone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+911234567890">+911234567890 (Aggregator)</SelectItem>
                      <SelectItem value="+911234567891">+911234567891 (Processor)</SelectItem>
                      <SelectItem value="+911234567892">+911234567892 (Manufacturer)</SelectItem>
                      <SelectItem value="+911234567893">+911234567893 (Distributor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="otp">OTP (use: 123456)</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otpForm.otp}
                    onChange={(e) => setOtpForm({...otpForm, otp: e.target.value})}
                    placeholder="123456"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;