import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

export const GlassCard = ({ children, className = '', ...props }: any) => {
  return (
    <div className={`glass ${className}`} {...props}>
      {children}
    </div>
  );
};

export const MagneticButton = ({ children, className = '' }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      className={className}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export const FloatingElement = ({ children, speed = 1, delay = 0 }: any) => {
  return (
    <motion.div
      animate={{ y: ['-5%', '5%'] }}
      transition={{
        repeat: Infinity,
        repeatType: 'mirror',
        duration: 3 / speed,
        delay,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedCounter = ({ from = 0, to = 100, format = (v: number) => Math.round(v).toString() }: any) => {
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export const ParallaxImage = ({ src, alt, className }: any) => {
  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8 }}
    />
  );
};

export const TiltEffect = ({ children }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
};

export const ScrollCarousel = ({ children }: any) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex">
      {children}
    </div>
  );
};

export const ShinyText = ({ text, className = '' }: any) => {
  return (
    <span className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400 animate-shine bg-[length:200%_auto] ${className}`}>
      {text}
    </span>
  );
};

export const ElectricBorder = ({ children, className = '' }: any) => {
  return (
    <div className={`relative p-[2px] rounded-2xl overflow-hidden ${className}`}>
      <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#10b981_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#10b981_100%)]" />
      <div className="relative w-full h-full bg-background rounded-2xl">
        {children}
      </div>
    </div>
  );
};

export const GlareHover = ({ children, className = '' }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16,185,129,0.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

export const GradualBlur = ({ children, className = '' }: any) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 backdrop-blur-md" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export const BlurText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      viewport={{ once: true }}
      className={className}
    >
      {text}
    </motion.div>
  );
};

export const TextPressure = ({ text, className = '' }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`flex justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {text.split('').map((char: string, i: number) => (
        <motion.span
          key={i}
          animate={{
            scaleY: isHovered ? [1, 1.5, 1] : 1,
            scaleX: isHovered ? [1, 0.8, 1] : 1,
            y: isHovered ? [0, -10, 0] : 0,
          }}
          transition={{
            duration: 0.4,
            delay: i * 0.05,
            ease: "easeInOut"
          }}
          className="inline-block origin-bottom"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export const ShuffleText = ({ text, className = '' }: any) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  const shuffle = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText((prev: string) =>
        prev.split('').map((char: string, index: number) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
  };

  useEffect(() => {
    shuffle();
  }, [text]);

  return <span onMouseEnter={shuffle} className={className}>{displayText}</span>;
};

export const FuzzyText = ({ text, className = '' }: any) => {
  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="fuzzy">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <span className={className} style={{ filter: 'url(#fuzzy)' }}>
        {text}
      </span>
    </>
  );
};

export const LogoLoop = ({ logos = [], className = '' }: any) => {
  const defaultLogos = logos.length ? logos : [
    { name: 'Haier', color: 'from-blue-600 to-indigo-600', badge: 'HAIER' },
    { name: 'Dawlance', color: 'from-red-600 to-rose-600', badge: 'DAWLANCE' },
    { name: 'PEL', color: 'from-emerald-600 to-teal-600', badge: 'PEL' },
    { name: 'Orient', color: 'from-amber-500 to-orange-600', badge: 'ORIENT' },
    { name: 'Kenwood', color: 'from-cyan-600 to-blue-600', badge: 'KENWOOD' },
    { name: 'National', color: 'from-green-600 to-emerald-700', badge: 'NATIONAL' },
    { name: 'Shan Foods', color: 'from-rose-500 to-pink-600', badge: 'SHAN' },
    { name: 'WestPoint', color: 'from-slate-700 to-slate-900', badge: 'WESTPOINT' },
    { name: 'Dell', color: 'from-sky-500 to-blue-600', badge: 'DELL' },
    { name: 'Anex', color: 'from-purple-600 to-indigo-700', badge: 'ANEX' },
  ];

  return (
    <div className={`py-6 overflow-hidden relative bg-foreground/[0.02] border-y border-foreground/[0.08] ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <motion.div
        className="flex gap-6 whitespace-nowrap w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ ease: 'linear', duration: 18, repeat: Infinity }}
      >
        {[...defaultLogos, ...defaultLogos].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass border border-foreground/10 shadow-md backdrop-blur-md hover:scale-105 transition-transform"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} text-white font-black text-xs flex items-center justify-center shadow-sm tracking-tighter`}>
              {item.badge ? item.badge.slice(0, 2) : item.name.slice(0, 2)}
            </div>
            <span className="text-xs font-bold tracking-wider text-foreground uppercase">{item.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export const MagicRings = ({ className = '' }: any) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute border border-emerald-500/30 rounded-full"
          style={{ width: i * 200, height: i * 200 }}
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{
            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i },
          }}
        />
      ))}
    </div>
  );
};

export const CurvedLoop = ({ text, className = '' }: any) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <path id="curve" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
        <text>
          <textPath href="#curve" startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
    </motion.div>
  );
};

/* --- Newly Requested React Bits Components --- */

// 1. Prism Background - High Visibility Optical Light Beams & Refraction Rays
export const PrismBackground = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* Dynamic Animated Chromatic Ray Beams */}
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.15, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-emerald-400/25 via-teal-400/20 to-cyan-500/25 blur-3xl opacity-70"
      />
      <motion.div
        animate={{ rotate: [360, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-l from-purple-500/20 via-pink-400/20 to-emerald-400/20 blur-3xl opacity-60"
      />
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-400/15 via-emerald-400/20 to-sky-400/20 blur-3xl opacity-60"
      />

      {/* Visible Glass Prism Lines / Angle Rays */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.06)_0%,transparent_40%,rgba(168,85,247,0.06)_70%,transparent_100%)]" />
    </div>
  );
};

// 2. Line Sidebar
export const LineSidebar = ({ items = [], activeItem, onItemSelect }: any) => {
  return (
    <aside className="w-64 border-r border-foreground/[0.08] p-4 flex flex-col gap-2 relative">
      <div className="text-xs font-bold uppercase tracking-wider text-foreground/40 px-3 py-2">Categories</div>
      {items.map((item: any) => {
        const isSelected = activeItem === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isSelected ? 'text-emerald-500 font-semibold' : 'text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="activeLineSidebar"
                className="absolute left-0 top-1 bottom-1 w-1 bg-emerald-500 rounded-r-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span>{item.name}</span>
            <span className="text-xs opacity-60">({item.count || 0})</span>
          </button>
        );
      })}
    </aside>
  );
};

// 3. Animated List
export const AnimatedList = ({ children, className = '' }: any) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// 4. Scroll Stack
export const ScrollStack = ({ items = [], renderItem }: any) => {
  return (
    <div className="flex flex-col gap-6 relative">
      {items.map((item: any, index: number) => (
        <motion.div
          key={item.id || index}
          className="sticky top-24 rounded-2xl glass p-6 border border-foreground/[0.08] shadow-lg"
          style={{ top: `${90 + index * 15}px` }}
        >
          {renderItem ? renderItem(item, index) : <div>{item.title || item.name}</div>}
        </motion.div>
      ))}
    </div>
  );
};

// 5. Bubble Menu
export const BubbleMenu = ({ items = [] }: any) => {
  return (
    <div className="fixed bottom-40 right-4 md:bottom-20 md:right-6 z-40 flex flex-col gap-3 items-end pointer-events-auto">
      {items.map((item: any, idx: number) => (
        <motion.a
          key={idx}
          href={item.href || '#'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="glass h-14 w-14 rounded-full shadow-xl flex shrink-0 items-center justify-center border border-[#186049]/30 text-[#186049] bg-background/80 hover:bg-[#186049] hover:text-white transition-colors"
          title={item.label}
        >
          {item.icon}
        </motion.a>
      ))}
    </div>
  );
};

// 6. Magic Bento
export const MagicBento = ({ children, className = '' }: any) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-4 ${className}`}>
      {children}
    </div>
  );
};

// 7. Circular Gallery
export const CircularGallery = ({ items = [] }: any) => {
  return (
    <div className="relative h-[380px] w-full flex items-center justify-center overflow-visible py-8">
      {items.map((item: any, i: number) => {
        const angle = (i / items.length) * 360;
        return (
          <motion.div
            key={i}
            className="absolute glass p-3.5 rounded-2xl border border-emerald-500/30 bg-background/80 shadow-2xl flex items-center gap-3 w-52 backdrop-blur-xl"
            animate={{
              rotate: [angle, angle + 360],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{
              transformOrigin: '0px 110px',
            }}
          >
            <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl shadow-md border border-foreground/10" />
            <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

// 8. Reflective Card
export const ReflectiveCard = ({ children, className = '' }: any) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden glass rounded-2xl border border-foreground/[0.08] transition-all ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
};

// 9. Card Nav
export const CardNav = ({ items = [] }: any) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
      {items.map((item: any, i: number) => (
        <motion.a
          key={i}
          href={item.link || '#'}
          whileHover={{ y: -5 }}
          className="glass p-5 rounded-2xl flex flex-col justify-between h-32 border border-foreground/[0.08] hover:border-emerald-500/30 transition-all group"
        >
          <div className="text-emerald-400 group-hover:scale-110 transition-transform w-fit">{item.icon}</div>
          <div>
            <div className="text-sm font-bold text-foreground">{item.title}</div>
            <div className="text-xs text-foreground/50">{item.subtitle}</div>
          </div>
        </motion.a>
      ))}
    </div>
  );
};

// 10. Stack
export const Stack = ({ children }: any) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 translate-x-3 translate-y-3 glass rounded-2xl border border-foreground/[0.05] opacity-50 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform" />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 glass rounded-2xl border border-foreground/[0.06] opacity-75 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// 11. Fluid Glass
export const FluidGlass = ({ children, className = '' }: any) => {
  return (
    <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
};

// 12. Pill Nav
export const PillNav = ({ items = [], active, onSelect }: any) => {
  return (
    <div className="inline-flex glass p-1.5 rounded-full border border-foreground/[0.1] bg-background/50 backdrop-blur-lg">
      {items.map((item: any) => {
        const isSelected = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`relative px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-colors ${
              isSelected ? 'text-emerald-950 font-bold' : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="pillNavActive"
                className="absolute inset-0 bg-emerald-400 rounded-full shadow-md z-[-1]"
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

// 13. Tilted Card
export const TiltedCard = ({ children, className = '' }: any) => {
  return (
    <motion.div
      whileHover={{ rotateX: 10, rotateY: -10, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`glass rounded-2xl border border-foreground/[0.08] p-4 shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 14. Masonry
export const Masonry = ({ children, columns = 3, className = '' }: any) => {
  return (
    <div className={`columns-1 sm:columns-2 md:columns-${columns} gap-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
};

// 15. Glass Surface
export const GlassSurface = ({ children, className = '' }: any) => {
  return (
    <div className={`glass bg-foreground/[0.03] backdrop-blur-2xl border border-foreground/[0.08] rounded-3xl p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};

// 16. Dome Gallery
export const DomeGallery = ({ items = [] }: any) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-3xl glass border border-foreground/[0.08] transform rotate-1 perspective-1000">
      {items.map((item: any, i: number) => (
        <motion.div key={i} whileHover={{ scale: 1.08, rotate: -2 }} className="aspect-square rounded-2xl overflow-hidden glass">
          <img src={item.image} alt={item.title || 'Dome Item'} className="w-full h-full object-cover" />
        </motion.div>
      ))}
    </div>
  );
};

// 17. Chroma Grid
export const ChromaGrid = ({ children, className = '' }: any) => {
  return (
    <div className={`relative p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-teal-500/10 shadow-inner ${className}`}>
      {children}
    </div>
  );
};

// 18. Lanyard
export const Lanyard = ({ name, title, avatar }: any) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
      whileHover={{ scale: 1.05 }}
      className="glass p-6 rounded-3xl border border-emerald-500/30 w-64 shadow-2xl flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
    >
      <div className="w-4 h-4 rounded-full bg-emerald-500/40 border border-emerald-400 mb-4" />
      <img src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"} alt={name} className="w-20 h-20 rounded-full border-2 border-emerald-400 object-cover mb-3" />
      <div className="font-bold text-foreground text-lg">{name || 'Customer Profile'}</div>
      <div className="text-xs text-emerald-400 font-medium">{title || 'VIP Member'}</div>
    </motion.div>
  );
};

// 19. Model Viewer
export const ModelViewer = ({ title = '3D Product Preview', image }: any) => {
  return (
    <div className="relative glass rounded-3xl border border-foreground/[0.1] p-6 flex flex-col items-center justify-center h-72 overflow-hidden group bg-background/40">
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <motion.img
        src={image || "https://images.unsplash.com/photo-1584285422892-74c26a67f08b?w=400&h=400&fit=crop"}
        alt={title}
        className="w-40 h-40 object-cover rounded-2xl shadow-2xl border border-foreground/10"
        animate={{ rotateY: 360, y: [0, -8, 0] }}
        transition={{ rotateY: { duration: 12, repeat: Infinity, ease: 'linear' }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <span className="text-xs font-bold text-foreground/80 mt-4 tracking-wider uppercase">{title}</span>
    </div>
  );
};

// 20. Profile Card
export const ProfileCard = ({ name, email, avatar, role }: any) => {
  return (
    <div className="glass p-6 rounded-3xl border border-foreground/[0.08] shadow-xl flex items-center gap-4 max-w-md w-full">
      <img src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} alt={name} className="w-14 h-14 rounded-2xl object-cover border border-emerald-400/40" />
      <div className="flex-1">
        <h4 className="font-bold text-foreground text-base">{name || 'User Account'}</h4>
        <p className="text-xs text-foreground/50">{email || 'user@example.com'}</p>
        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {role || 'Verified Buyer'}
        </span>
      </div>
    </div>
  );
};
