'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  Zap,
  BarChart3,
  Target,
  Activity,
  CheckCircle,
  Users,
  Trophy,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  AnimatedCounter,
  ScrollReveal,
  GradientText,
  FloatingElements,
  AnimatedButton,
  StaggerContainer,
  StaggerItem,
  TypingLoop,
} from '@/components/animations';

// Feature cards data
const features = [
  {
    icon: Zap,
    title: 'AI-Powered Predictions',
    description:
      'Our machine learning models analyze player form, fixtures, and historical data to predict optimal point returns.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Deep dive into player statistics, expected goals (xG), clean sheet probabilities, and more advanced metrics.',
  },
  {
    icon: Target,
    title: 'Optimal Transfers',
    description:
      'Get personalized transfer recommendations that maximize your team value and expected points each gameweek.',
  },
  {
    icon: Activity,
    title: 'Real-time Updates',
    description:
      'Stay ahead with instant price change alerts, injury updates, and fixture difficulty ratings.',
  },
];

// Testimonials data
const testimonials = [
  {
    quote:
      "FPL Optimizer helped me win my mini-league for the first time. The AI predictions are incredibly accurate!",
    author: 'James Wilson',
    role: 'FPL Manager since 2018',
    initials: 'JW',
  },
  {
    quote:
      "The transfer recommendations saved me countless hours of research. Best FPL tool I've ever used.",
    author: 'Sarah Chen',
    role: 'Top 10K Manager',
    initials: 'SC',
  },
  {
    quote:
      "Went from mid-table to winning my work league. The analytics gave me the edge I needed.",
    author: 'Michael Thompson',
    role: 'Work League Champion',
    initials: 'MT',
  },
];

// How it works steps
const steps = [
  {
    number: '01',
    title: 'Connect Your Team',
    description:
      'Enter your FPL team ID to sync your squad. We analyze your current players, budget, and formation.',
    icon: Users,
  },
  {
    number: '02',
    title: 'AI Analysis',
    description:
      'Our algorithms crunch the numbers, evaluating player form, fixtures, and statistical models.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Get Recommendations',
    description:
      'Receive personalized transfer suggestions, captain picks, and chip strategy recommendations.',
    icon: Target,
  },
  {
    number: '04',
    title: 'Dominate Your League',
    description:
      'Make data-driven decisions and watch your team climb the ranks with optimal moves every week.',
    icon: Trophy,
  },
];

// FAQ data
const faqs = [
  {
    question: 'How does the AI prediction model work?',
    answer:
      'Our XGBoost-based machine learning model analyzes multiple factors including player form, fixture difficulty, historical performance, team strength, and more. It\'s trained on 5+ seasons of FPL data and achieves high accuracy in predicting player returns.',
  },
  {
    question: 'Is FPL Optimizer free to use?',
    answer:
      'Yes! We offer a free tier with basic predictions and analytics. Premium features including advanced statistics, unlimited optimizations, and real-time alerts are available with a subscription.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Player data is updated daily from the official FPL API. Price changes happen throughout the day during active gameweeks. Injury and team news are monitored 24/7.',
  },
  {
    question: 'Can I use FPL Optimizer on mobile?',
    answer:
      'Absolutely! Our platform is fully responsive and works great on mobile browsers. We also have native iOS and Android apps coming soon.',
  },
  {
    question: 'What makes FPL Optimizer different from other tools?',
    answer:
      'We combine cutting-edge AI with intuitive design. Our linear programming optimization engine finds the mathematically optimal squad for your budget, while our prediction models are trained specifically on FPL scoring patterns.',
  },
  {
    question: 'Is my FPL account data safe?',
    answer:
      'We only access public FPL data via the official API. We never store your FPL password or access private account information. Your data is encrypted and never shared with third parties.',
  },
];

// Typing headlines for hero
const heroHeadlines = [
  'Dominate Your Fantasy League',
  'Win Your Mini-League',
  'Climb The Global Rankings',
  'Optimize Your FPL Team',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Floating Background Elements */}
        <FloatingElements count={10} />

        <div className="max-w-7xl mx-auto relative z-10">
          <StaggerContainer staggerDelay={0.1} className="text-center">
            {/* Trust Badge */}
            <StaggerItem direction="fade">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Users className="w-4 h-4 text-fpl-light" />
                  <span className="text-white/80 text-sm font-medium">
                    Trusted by <AnimatedCounter end={10} suffix="K+" duration={2} /> FPL managers
                  </span>
                </div>
              </div>
            </StaggerItem>

            {/* Main Headline with Gradient Text and Typing Effect */}
            <StaggerItem direction="up">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-white block mb-2">
                  <TypingLoop
                    texts={heroHeadlines}
                    speed={60}
                    deleteSpeed={40}
                    pauseDuration={2500}
                    className="text-fpl-light"
                  />
                </span>
                <GradientText className="block text-3xl sm:text-4xl lg:text-5xl">
                  with AI-Powered Insights
                </GradientText>
              </h1>
            </StaggerItem>

            {/* Subheadline */}
            <StaggerItem direction="up">
              <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
                AI-powered predictions, optimal transfers, and advanced analytics to help you win your
                mini-leagues and climb the global rankings.
              </p>
            </StaggerItem>

            {/* CTA Buttons */}
            <StaggerItem direction="up">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="bg-fpl-light text-fpl-green hover:bg-white font-bold text-lg px-8 py-6 h-auto"
                >
                  Start Free
                </AnimatedButton>
                <AnimatedButton
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 h-auto"
                  showArrow={false}
                >
                  View Pricing
                </AnimatedButton>
              </div>
            </StaggerItem>

            {/* Trust Indicators */}
            <StaggerItem direction="up">
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-fpl-light" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-fpl-light" />
                  <span>Free tier available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-fpl-light" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Background gradient decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fpl-light/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Everything You Need to <GradientText>Win</GradientText>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Powerful tools and insights designed to give you the competitive edge in your FPL
                journey.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.1}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <StaggerItem key={index} direction="up">
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full hover:bg-white/10 transition-all group">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-fpl-light/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-fpl-light" />
                      </div>
                      <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-fpl-green/50">
        <div className="max-w-7xl mx-auto">
          {/* Stats Bar */}
          <ScrollReveal direction="up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-fpl-light mb-2">
                  <AnimatedCounter end={5} suffix="M+" duration={2} />
                </div>
                <div className="text-white/60">Points Optimized</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-fpl-light mb-2">
                  <AnimatedCounter end={50} suffix="K+" duration={2.2} />
                </div>
                <div className="text-white/60">Squads Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-fpl-light mb-2">
                  <AnimatedCounter end={10} suffix="K+" duration={1.8} />
                </div>
                <div className="text-white/60">Active Users</div>
              </div>
            </div>
          </ScrollReveal>

          {/* Testimonials */}
          <ScrollReveal direction="up" delay={0.2}>
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              What Managers Are <GradientText>Saying</GradientText>
            </h2>
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.15}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index} direction="up">
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-fpl-light/20 flex items-center justify-center">
                          <span className="text-fpl-light font-bold">{testimonial.initials}</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">{testimonial.author}</div>
                          <div className="text-white/50 text-sm">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-white/70 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                How It <GradientText>Works</GradientText>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Get started in minutes and let our AI do the heavy lifting for your FPL decisions.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.15}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, index) => (
              <StaggerItem key={index} direction="up" className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-white/10" />
                )}

                <div className="text-center">
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-fpl-light/10 border border-fpl-light/20 flex items-center justify-center relative z-10"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 255, 133, 0.2)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <step.icon className="w-10 h-10 text-fpl-light" />
                  </motion.div>
                  <div className="text-fpl-light font-bold text-sm mb-2">Step {step.number}</div>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-white/60 text-sm">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-fpl-green/50">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently Asked <GradientText>Questions</GradientText>
              </h2>
              <p className="text-white/60">
                Got questions? We&apos;ve got answers.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white/5 border border-white/10 rounded-xl px-6 data-[state=open]:bg-white/10 transition-colors"
                >
                  <AccordionTrigger className="text-white hover:text-fpl-light text-left py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <StaggerContainer staggerDelay={0.1} className="text-center">
            <StaggerItem direction="up">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to <GradientText>Win</GradientText> Your League?
              </h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
                Join thousands of FPL managers who are already using AI-powered insights to dominate
                their mini-leagues. Start optimizing today.
              </p>
            </StaggerItem>

            <StaggerItem direction="up">
              <div className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    id="home-email"
                    name="email"
                    aria-label="Email address for signup"
                    placeholder="Enter your email"
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 flex-1"
                  />
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    className="h-14 px-8 whitespace-nowrap"
                  >
                    Get Started Free
                  </AnimatedButton>
                </div>
                <p className="text-white/40 text-sm mt-4">
                  Free forever plan available. No credit card required.
                </p>
              </div>
            </StaggerItem>

            {/* Bottom trust indicators */}
            <StaggerItem direction="up">
              <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-white/40 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>89% user satisfaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>10,000+ active users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>500+ league winners</span>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />
    </div>
  );
}
