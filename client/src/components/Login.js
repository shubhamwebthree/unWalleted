import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogIn, Sparkles, Twitter, Youtube, MessageCircle, FileText, Wallet, Shield, Zap, CheckCircle2, ArrowRight, Menu, X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const headerRef = useRef(null);
  const heroCanvasRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Login state from first component
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signInWithEmail, signInWithSocial, loading } = useAuth();

  // Login handlers from first component
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await signInWithEmail(email);
      setEmailSent(true);
    } catch (error) {
      setEmailSent(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    try {
      await signInWithSocial(provider);
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-lg', 'border-b', 'border-slate-200/50');
        } else {
          headerRef.current.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-lg', 'border-b', 'border-slate-200/50');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Smooth scroll for navigation links
  const handleNavLinkClick = useCallback((e, targetId) => {
    if (targetId && document.getElementById(targetId)) {
      e.preventDefault();
      document.getElementById(targetId).scrollIntoView({
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  }, []);

  // Enhanced particle animation
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulse = 0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;

        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          this.x -= dx * 0.01;
          this.y -= dy * 0.01;
        }

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        const pulseRadius = this.radius + Math.sin(this.pulse) * 0.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseRadius * 2);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    function createParticles() {
      particles = [];
      const particleCount = Math.floor(width * height / 20000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    let animationFrameId;
    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Enhanced connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.3;
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(99, 102, 241, ${opacity})`);
            gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity})`);
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      resize();
      createParticles();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    createParticles();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Loading state from first component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            overflow-x: hidden;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-float-delayed {
            animation: float 6s ease-in-out infinite 2s;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .feature-card {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          
          .feature-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }
          
          .btn-primary:hover {
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
          }
        `}
      </style>

      {/* Header */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-black gradient-text">
            TaskFlow
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} 
               className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-300">
              Features
            </a>
            <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} 
               className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-300">
              How It Works
            </a>
            <a href="#login" onClick={(e) => handleNavLinkClick(e, 'login')} 
               className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-300">
              Login
            </a>
          </div>
          
          <button 
            onClick={(e) => handleNavLinkClick(e, 'login')}
            className="hidden md:flex items-center gap-2 btn-primary text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
          >
            <LogIn size={18} />
            Get Started
          </button>
          
          <button onClick={toggleMobileMenu} className="md:hidden text-slate-800 p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
        
        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-white/95 backdrop-blur-md border-t border-slate-200/50`}>
          <div className="px-6 py-4 space-y-4">
            <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} 
               className="block text-slate-700 hover:text-indigo-600 font-medium transition-colors">
              Features
            </a>
            <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} 
               className="block text-slate-700 hover:text-indigo-600 font-medium transition-colors">
              How It Works
            </a>
            <a href="#login" onClick={(e) => handleNavLinkClick(e, 'login')} 
               className="block text-slate-700 hover:text-indigo-600 font-medium transition-colors">
              Login
            </a>
            <button 
              onClick={(e) => handleNavLinkClick(e, 'login')}
              className="w-full btn-primary text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <canvas ref={heroCanvasRef} className="absolute inset-0 z-0"></canvas>
          
          <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
            <div className="animate-float">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-tight mb-8">
                <span className="gradient-text">TaskFlow</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
                Complete daily social tasks and earn <span className="font-semibold text-indigo-600">Flow NFTs</span> or tokens. 
                No wallets, no gas fees, no complexity—just <span className="font-semibold text-purple-600">pure rewards</span>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-float-delayed">
              <button
                onClick={(e) => handleNavLinkClick(e, 'login')}
                className="group btn-primary text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-3"
              >
                <Sparkles className="group-hover:animate-spin" size={20} />
                Start Earning Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button 
                onClick={(e) => handleNavLinkClick(e, 'howitworks')}
                className="group bg-white/80 backdrop-blur-sm text-slate-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all duration-300 shadow-lg border border-slate-200/50 flex items-center gap-3"
              >
                Learn How It Works
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Social Actions. <span className="gradient-text">Real Rewards.</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Transform your daily social media activities into valuable Flow-based assets. 
                Every tweet, post, and interaction becomes an opportunity to earn.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Twitter className="text-blue-500" size={32} />,
                  title: "Daily Social Tasks",
                  description: "Tweet, post blogs, upload shorts, or chat in groups. Every action counts toward your rewards."
                },
                {
                  icon: <Sparkles className="text-purple-500" size={32} />,
                  title: "Instant Rewards",
                  description: "Mint NFTs and receive tokens automatically as soon as you complete tasks—no manual claiming."
                },
                {
                  icon: <Shield className="text-green-500" size={32} />,
                  title: "Walletless Experience",
                  description: "No wallet setup, no private keys. Your account is abstracted and transactions are sponsored."
                },
                {
                  icon: <Zap className="text-yellow-500" size={32} />,
                  title: "User-Friendly Onboarding",
                  description: "Sign in with Google or Email. No blockchain experience required to start earning immediately."
                },
                {
                  icon: <FileText className="text-indigo-500" size={32} />,
                  title: "Smart Contracts",
                  description: "Flow's Cadence contracts manage task states, rewards, and achievement tracking securely."
                },
                {
                  icon: <Wallet className="text-teal-500" size={32} />,
                  title: "Built on Flow",
                  description: "Enjoy scalability, fast finality, and low-cost transactions—all abstracted from users."
                }
              ].map((feature, index) => (
                <div key={index} className="feature-card glass-card p-8 rounded-3xl shadow-lg hover:shadow-2xl">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="howitworks" className="py-24 lg:py-32 bg-gradient-to-r from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                How It Works in <span className="gradient-text">3 Simple Steps</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Earning rewards on Flow is now as easy as sharing your voice. No crypto knowledge needed.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 z-0"></div>
              
              {[
                {
                  step: "1",
                  title: "Sign In Instantly",
                  description: "Log in using your Google or Email account. We'll create a Flow account for you—no setup required.",
                  icon: <LogIn className="text-indigo-600" size={24} />
                },
                {
                  step: "2", 
                  title: "Complete Tasks",
                  description: "Choose from daily challenges: tweet, post on LinkedIn, upload Shorts, or chat in communities.",
                  icon: <CheckCircle2 className="text-purple-600" size={24} />
                },
                {
                  step: "3",
                  title: "Earn Rewards",
                  description: "Once verified, we automatically mint NFTs or tokens to your Flow account—no signatures needed.",
                  icon: <Sparkles className="text-pink-600" size={24} />
                }
              ].map((item, index) => (
                <div key={index} className="relative z-10 text-center">
                  <div className="flex items-center justify-center bg-white w-20 h-20 mx-auto rounded-full text-2xl font-black gradient-text shadow-xl border-4 border-white mb-8">
                    {item.step}
                  </div>
                  <div className="glass-card p-8 rounded-3xl shadow-lg">
                    <div className="flex justify-center mb-4">{item.icon}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Login Section - Integrated from first component */}
        <section id="login" className="py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to TaskFlow</h2>
                <p className="text-slate-600">Earn tokens by completing Web3 tasks</p>
              </div>

              {/* Login Form */}
              <div className="glass-card rounded-3xl p-8 shadow-xl">
                {!emailSent ? (
                  <>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-400" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit(e)}
                            placeholder="Enter your email"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleEmailSubmit}
                        disabled={isLoading || !email.trim()}
                        className="w-full btn-primary text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Sending Magic Link...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5" />
                            <span>Send Magic Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="my-8 flex items-center">
                      <div className="flex-1 border-t border-slate-200"></div>
                      <span className="px-4 text-slate-500 text-sm">or</span>
                      <div className="flex-1 border-t border-slate-200"></div>
                    </div>

                    {/* Social Login Options */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-slate-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Mail className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-3">Check Your Email</h3>
                    <p className="text-slate-600 mb-4">
                      We've sent a magic link to <span className="font-medium text-slate-900">{email}</span>
                    </p>
                    <p className="text-sm text-slate-500 mb-8">
                      Click the link in your email to sign in. The link will expire in 10 minutes.
                    </p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="text-indigo-600 hover:text-indigo-700 underline text-sm font-medium"
                    >
                      Use a different email
                    </button>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="glass-card rounded-xl p-4 mb-2">
                    <Shield className="h-6 w-6 text-indigo-500 mx-auto" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Secure</p>
                </div>
                <div className="text-center">
                  <div className="glass-card rounded-xl p-4 mb-2">
                    <Zap className="h-6 w-6 text-indigo-500 mx-auto" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Fast</p>
                </div>
                <div className="text-center">
                  <div className="glass-card rounded-xl p-4 mb-2">
                    <Sparkles className="h-6 w-6 text-indigo-500 mx-auto" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Web3</p>
                </div>
              </div>

              {/* Info */}
              <div className="mt-8 text-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  By signing in, you agree to our terms and privacy policy.
                  <br />
                  Your Flow wallet will be automatically created.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;