'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  cursorClassName?: string;
  onComplete?: () => void;
  once?: boolean;
}

export function TypingText({
  text,
  speed = 50,
  delay = 0,
  className = '',
  showCursor = true,
  cursorClassName = '',
  onComplete,
  once = true,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });
  const hasTyped = useRef(false);

  useEffect(() => {
    if (!isInView || (once && hasTyped.current)) return;
    hasTyped.current = true;

    const timeout = setTimeout(() => {
      setIsTyping(true);
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, text, speed, delay, once, onComplete]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      {showCursor && (
        <motion.span
          className={`inline-block w-[2px] h-[1em] bg-current ml-1 ${cursorClassName}`}
          animate={{ opacity: isTyping ? [1, 0, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: isTyping ? Infinity : 0,
            repeatType: 'loop',
          }}
        />
      )}
    </span>
  );
}

interface TypingLoopProps {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypingLoop({
  texts,
  speed = 50,
  deleteSpeed = 30,
  pauseDuration = 2000,
  className = '',
}: TypingLoopProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const currentText = texts[currentTextIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayedText.length < currentText.length) {
            setDisplayedText(currentText.slice(0, displayedText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), pauseDuration);
          }
        } else {
          if (displayedText.length > 0) {
            setDisplayedText(displayedText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [
    displayedText,
    isDeleting,
    currentTextIndex,
    texts,
    speed,
    deleteSpeed,
    pauseDuration,
    isInView,
  ]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      <motion.span
        className="inline-block w-[2px] h-[1em] bg-current ml-1"
        animate={{ opacity: [1, 0, 1] }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
    </span>
  );
}
