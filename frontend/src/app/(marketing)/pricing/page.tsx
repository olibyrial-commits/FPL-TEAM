'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Zap, Crown, Trophy, ChevronRight, Sparkles } from 'lucide-react';
import {
  ScrollReveal,
  GradientText,
  StaggerContainer,
  StaggerItem,
  AnimatedButton,
  PulseRing,
} from '@/components/animations';

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Get started with basic optimization',
    features: [
      { name: '1 optimization per month', included: true },
      { name: '1 week horizon', included: true },
      { name: 'Basic transfer strategy', included: true },
      { name: 'No chips optimization', included: true },
      { name: 'Community support', included: true },
      { name: 'Multi-gameweek planning', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Email support', included: false },
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Trophy,
    monthlyPrice: 9.99,
    yearlyPrice: 99.90,
    description: 'Best for serious FPL managers',
    features: [
      { name: 'Unlimited optimizations', included: true },
      { name: '4 week horizon', included: true },
      { name: 'Advanced transfer strategy', included: true },
      { name: 'Chip optimization included', included: true },
      { name: 'Email support', included: true },
      { name: 'Multi-gameweek planning', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: false },
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    icon: Crown,
    monthlyPrice: 19.99,
    yearlyPrice: 191.90,
    description: 'Everything in Pro, plus premium features',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: '8 week horizon', included: true },
      { name: 'Premium strategy insights', included: true },
      { name: 'Priority support', included: true },
      { name: 'Early access to new features', included: true },
      { name: '1-on-1 strategy consultation', included: true },
      { name: 'Custom optimization rules', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Go Elite',
    ctaVariant: 'secondary' as const,
    popular: false,
  },
];

const comparisonFeatures = [
  { name: 'Optimizations per month', free: '1', pro: 'Unlimited', elite: 'Unlimited' },
  { name: 'Planning horizon', free: '1 week', pro: '4 weeks', elite: '8 weeks' },
  { name: 'Transfer strategy', free: 'Basic', pro: 'Advanced', elite: 'Premium' },
  { name: 'Chip optimization', free: '✕', pro: '✓', elite: '✓' },
  { name: 'Multi-gameweek planning', free: '✕', pro: '✓', elite: '✓' },
  { name: 'Advanced analytics', free: '✕', pro: '✓', elite: '✓' },
  { name: 'Support', free: 'Community', pro: 'Email', elite: 'Priority' },
  { name: 'Strategy consultation', free: '✕', pro: '✕', elite: '✓' },
  { name: 'API access', free: '✕', pro: '✕', elite: '✓' },
];

const faqs = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 7-day money-back guarantee for Pro and Elite plans. If you are not satisfied, contact us within 7 days for a full refund.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay.',
  },
  {
    question: 'Can I switch between monthly and yearly billing?',
    answer: 'Yes, you can switch between monthly and yearly billing at any time. When switching to yearly, you will immediately save 20%.',
  },
  {
    question: 'Is there a limit on how many teams I can optimize?',
    answer: 'No, you can optimize as many FPL teams as you want with Pro and Elite plans. The Free plan is limited to one optimization per month per account.',
  },
  {
    question: 'Do you store my FPL team data?',
    answer: 'We only store your team ID temporarily during optimization. No personal data is retained after the session ends.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fpl-green via-fpl-purple to-fpl-green">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal direction="up">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Choose Your <GradientText>Plan</GradientText>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Select the perfect plan for your fantasy football ambitions
            </p>
          </ScrollReveal>

          {/* Monthly/Yearly Toggle */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-white/50'}`}>
                Monthly
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                {isYearly && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Badge className="bg-fpl-light text-fpl-green text-xs font-bold">
                      Save 20%
                    </Badge>
                  </motion.div>
                )}
              </div>
              <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-white/50'}`}>
                Yearly
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <StaggerContainer staggerDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <StaggerItem key={plan.id} direction="scale">
                <motion.div
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="relative h-full"
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Badge className="bg-fpl-light text-fpl-green font-bold px-4 py-1 flex items-center gap-2">
                          <PulseRing size={6} color="#37003c" duration={1.5} />
                          Most Popular
                        </Badge>
                      </motion.div>
                    </div>
                  )}
                  <Card
                    className={`h-full border transition-all duration-300 ${
                      plan.popular
                        ? 'border-fpl-light shadow-lg shadow-fpl-light/20'
                        : 'border-white/10 hover:border-white/20'
                    } bg-white/5 backdrop-blur-sm`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-fpl-light' : 'text-white/70'}`} />
                        <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="text-white/60">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-white">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-white/50">/{isYearly ? 'year' : 'month'}</span>
                        {isYearly && plan.yearlyPrice > 0 && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-fpl-light text-sm mt-1"
                          >
                            Save ${((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(2)}/year
                          </motion.p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            {feature.included ? (
                              <motion.div
                                className="w-5 h-5 rounded-full bg-fpl-light/20 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + i * 0.05, type: 'spring', stiffness: 300 }}
                              >
                                <Check className="w-3 h-3 text-fpl-light" />
                              </motion.div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                <X className="w-3 h-3 text-white/30" />
                              </div>
                            )}
                            <span className={feature.included ? 'text-white/80 text-sm' : 'text-white/40 text-sm'}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <AnimatedButton
                        variant={plan.popular ? 'primary' : plan.id === 'elite' ? 'secondary' : 'outline'}
                        className={`w-full ${
                          plan.popular
                            ? 'bg-fpl-light text-fpl-green hover:bg-white'
                            : plan.id === 'elite'
                            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            : 'border-white/20 text-white hover:bg-white/10'
                        }`}
                        showArrow={false}
                      >
                        {plan.cta}
                      </AnimatedButton>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Compare <GradientText>All Features</GradientText>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-white/60 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 text-white font-semibold">Free</th>
                    <th className="text-center py-4 px-4 text-fpl-light font-semibold">Pro</th>
                    <th className="text-center py-4 px-4 text-white font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <motion.tr
                      key={index}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-4 px-4 text-white/80">{feature.name}</td>
                      <td className="py-4 px-4 text-center">
                        {feature.free === '✓' ? (
                          <Check className="w-5 h-5 text-fpl-light mx-auto" />
                        ) : feature.free === '✕' ? (
                          <X className="w-5 h-5 text-white/30 mx-auto" />
                        ) : (
                          <span className="text-white/60 text-sm">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.pro === '✓' ? (
                          <Check className="w-5 h-5 text-fpl-light mx-auto" />
                        ) : feature.pro === '✕' ? (
                          <X className="w-5 h-5 text-white/30 mx-auto" />
                        ) : (
                          <span className="text-fpl-light text-sm font-medium">{feature.pro}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.elite === '✓' ? (
                          <Check className="w-5 h-5 text-fpl-light mx-auto" />
                        ) : feature.elite === '✕' ? (
                          <X className="w-5 h-5 text-white/30 mx-auto" />
                        ) : (
                          <span className="text-white text-sm font-medium">{feature.elite}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked <GradientText>Questions</GradientText>
            </h2>
          </ScrollReveal>

          <StaggerContainer staggerDelay={0.1} className="space-y-4">
            {faqs.map((faq, index) => (
              <StaggerItem key={index} direction="up">
                <motion.div
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-fpl-light" />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/60">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="scale">
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Not sure which plan?
              </h2>
              <p className="text-xl text-white/70 mb-8">
                Start with Free, upgrade anytime as your FPL ambitions grow
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="text-lg px-8"
                >
                  Get Started Free
                </AnimatedButton>
                <AnimatedButton
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
                  showArrow={false}
                >
                  Contact Sales
                </AnimatedButton>
              </div>
              <p className="text-white/40 text-sm mt-6">
                No credit card required for free plan
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/40 text-sm">
            Questions? Contact us at support@fploptimizer.com
          </p>
        </div>
      </footer>
    </div>
  );
}
