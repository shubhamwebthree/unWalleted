import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogIn, Sparkles, Twitter, Youtube, MessageCircle, FileText, Wallet, Shield, Zap, CheckCircle2, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const headerRef = useRef(null);
  const heroCanvasRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signInWithGoogle, loading } = useAuth();

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
            unWalleted
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
            <a href="#tech" onClick={(e) => handleNavLinkClick(e, 'tech')} 
               className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-300">
              Technology
            </a>
          </div>
          
          <button 
            onClick={signInWithGoogle}
            disabled={loading}
            className="hidden md:flex items-center gap-2 btn-primary text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogIn size={18} />
            )}
            {loading ? 'Signing in...' : 'Get Started'}
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
            <a href="#tech" onClick={(e) => handleNavLinkClick(e, 'tech')} 
               className="block text-slate-700 hover:text-indigo-600 font-medium transition-colors">
              Technology
            </a>
            <button 
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full btn-primary text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Signing in...' : 'Get Started'}
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
                <span className="gradient-text">unWalleted</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
                Complete daily social tasks and earn <span className="font-semibold text-indigo-600">Flow NFTs</span> or tokens. 
                No wallets, no gas fees, no complexity—just <span className="font-semibold text-purple-600">pure rewards</span>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-float-delayed">
              <button
  onClick={signInWithGoogle}
  disabled={loading}
  className="group btn-primary text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-3 disabled:opacity-50"
>
  {loading ? (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  ) : (
    <Sparkles className="group-hover:animate-spin" size={20} />
  )}
  {loading ? 'Signing in...' : 'Start Earning Now'}
  {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
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

        {/* Technology Section */}
        <section id="tech" className="py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Why Choose <span className="gradient-text">unWalleted?</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                We simplify crypto earning. No gas fees, no bridges, no friction—just pure rewards.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Wallet className="text-emerald-500" size={28} />,
                  title: "No Wallet Required",
                  description: "Accounts are created automatically using Flow's account abstraction. Start earning with just an email address."
                },
                {
                  icon: <Shield className="text-blue-500" size={28} />,
                  title: "Sponsored Transactions",
                  description: "We cover all blockchain fees. Our backend handles transactions for you—no confirmations needed."
                },
                {
                  icon: <Sparkles className="text-purple-500" size={28} />,
                  title: "Real On-Chain Assets",
                  description: "Every NFT and token you earn lives on Flow—verifiable, transferable, and truly yours forever."
                },
                {
                  icon: <Zap className="text-orange-500" size={28} />,
                  title: "Built for Everyone",
                  description: "No blockchain background needed. We handle all complexity so you can focus on earning and having fun."
                }
              ].map((item, index) => (
                <div key={index} className="feature-card glass-card p-8 rounded-3xl flex items-start gap-6 shadow-lg hover:shadow-2xl">
                  <div className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-md">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-12 leading-relaxed">
              Join thousands of users already earning real rewards for their social media activities.
            </p>
            <button 
              onClick={signInWithGoogle}
              disabled={loading}
              className="group bg-white text-indigo-600 px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 flex items-center gap-3 mx-auto"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="group-hover:animate-spin" size={24} />
              )}
              {loading ? 'Getting Started...' : 'Get Started Free'}
              {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
