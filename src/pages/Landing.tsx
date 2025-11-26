import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { MessageCircle, TrendingUp, Heart } from "lucide-react";
import heroImage from "@/assets/hero-meditation.jpg";
import { motion, Variants } from "framer-motion";

const Landing = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, rotate: -2 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Redirect if already logged in
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="space-y-8">
              <motion.div variants={itemVariants} className="inline-block mb-4">
                <img src="/logo.png" alt="Serenify Logo" className="w-20 h-20 rounded-full shadow-lg mb-6" />
                <br />
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  ✨ Welcome to Serenify
                </span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold leading-tight text-balance">
                Your Personal Mental Health{" "}
                <span className="gradient-text animate-gradient inline-block">
                  Companion
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-muted-foreground leading-relaxed">
                24/7 support, mood tracking, and personalized wellness activities to help you thrive every day
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild className="text-lg shadow-lg hover:shadow-xl transition-all group">
                  <Link to="/onboarding">
                    Get Started Free
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg">
                  <Link to="/about">Learn More</Link>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-accent text-2xl">✓</span>
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent text-2xl">✓</span>
                  <span>Private & secure</span>
                </div>
              </motion.div>
            </div>

            <motion.div variants={imageVariants} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl transform rotate-6"></div>
              <img
                src={heroImage}
                alt="Person meditating peacefully"
                className="rounded-3xl shadow-2xl w-full relative z-10 hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-balance">
              Everything you need for your wellbeing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to support your mental health journey
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-card to-primary/5 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all card-hover border border-primary/10 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">AI Companion</h3>
              <p className="text-muted-foreground leading-relaxed">
                Chat anytime with an empathetic AI trained in supportive listening.
                Share your thoughts in a safe, judgment-free space.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-gradient-to-br from-card to-secondary/5 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all card-hover border border-secondary/10 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-secondary transition-colors">Mood Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize your emotional journey and discover patterns.
                Understanding your moods helps you take better care of yourself.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-gradient-to-br from-card to-accent/5 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all card-hover border border-accent/10 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">Wellness Activities</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get personalized recommendations for mindfulness, exercise, and self-care.
                Small steps toward feeling better every day.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              <strong>Important:</strong> This is a supportive tool, not a replacement for professional help.
              If you're in crisis, please reach out to a{" "}
              <Link to="/crisis" className="text-primary hover:underline">
                mental health professional or crisis helpline
              </Link>
              .
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <Link to="/crisis" className="text-muted-foreground hover:text-foreground transition-colors">
                Crisis Resources
              </Link>
              <span className="text-border">•</span>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
