import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import AsciiText from './reference_components/AsciiText.jsx'
import Counter from './reference_components/Counter.jsx'
import ClickSpark from './reference_components/ClickSpark.jsx'
import { StaggeredMenu } from './reference_components/StaggeredMenu.jsx'
import ScrollReveal from './reference_components/ScrollReveal.jsx'
import ElectricBorder from './reference_components/ElectricBorder.jsx'
import Shuffle from './Shuffle/Shuffle.jsx'
import subscriberData from '../../data/subscribers.json'
import './App.css'
import logoSrc from '@root/assets/Logo.jpg'

const DomeGallery = lazy(() => import('./reference_components/DomeGallery.jsx'))
const FlowingMenu = lazy(() => import('./reference_components/FlowingMenu.jsx'))

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  )
}

function LoadingScreen({ active }) {
  return (
    <div className={`loadingScreen ${active ? '' : 'loadingScreen--hidden'}`} role="status" aria-live="polite">
      <span className="loadingScreen__ring" aria-hidden="true" />
      <span className="loadingScreen__label">Loading the reel…</span>
    </div>
  )
}

const VIDEO_IDS = [
  'cpzfPTQvMP4',
  '9e7RYaR8bag',
  'W0bxWYQwnR8',
  'pE3x4viMEiw',
  'F65MdnriqKU',
  'QyOShwegOuc',
  'tBgdoBf8FnE',
  'vvcxyioAvi4',
  'mGMC0vzxrR0',
  'WuL-0rIW85Y',
  'n86t-Tw7BzU',
  'deTyjwxNAJ8'
]

// Small original brand-color monogram badges — not the platforms' actual
// logo artwork (which is trademarked), just a colored visual cue.
function GumroadBadge({ className = '', ...rest }) {
  return (
    <span className={`brandBadge brandBadge--gumroad ${className}`} {...rest}>
      G
    </span>
  )
}

function FiverrBadge({ className = '', ...rest }) {
  return (
    <span className={`brandBadge brandBadge--fiverr ${className}`} {...rest}>
      fi
    </span>
  )
}

function CoffeeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 9h13a3 3 0 0 1 0 6h-1" />
      <path d="M4 9v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
      <path d="M7 4c-.5 1 .5 1.5 0 3" />
      <path d="M11 4c-.5 1 .5 1.5 0 3" />
    </svg>
  )
}

const SUPPORT_LINKS = [
  {
    title: 'Gumroad store',
    description: 'Own animation toolkits, presets, and motion art.',
    url: 'https://medhianaffeti.gumroad.com/',
    icon: GumroadBadge
  },
  {
    title: 'Buy me a coffee',
    description: 'Support the channel and fuel the next motion experiment.',
    url: 'https://medhianaffeti.gumroad.com/coffee',
    icon: CoffeeIcon
  }
]

const COMMISSIONS_URL = 'https://www.fiverr.com/s/wkaQl7o'

// Add an Upwork entry here once you have the gig URL, e.g.
// { name: 'Upwork', url: 'https://www.upwork.com/...', icon: SomeIcon }
const COMMISSION_PLATFORMS = [{ name: 'Fiverr', url: COMMISSIONS_URL, icon: FiverrBadge }]

// --- Responsive helpers -----------------------------------------------

const BREAKPOINTS = { mobile: 560, tablet: 980, laptop: 1280 }

function getBucket(width) {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  if (width < BREAKPOINTS.laptop) return 'laptop'
  return 'desktop'
}

function useViewportBucket() {
  const [bucket, setBucket] = useState(() =>
    typeof window === 'undefined' ? 'desktop' : getBucket(window.innerWidth)
  )

  useEffect(() => {
    let frame = null
    const onResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        setBucket(getBucket(window.innerWidth))
        frame = null
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return bucket
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (e) => setReduced(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Lightweight scroll-reveal wrapper for cards/blocks (headings already use
// the react-bits ScrollReveal component; this covers everything else).
function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

function App() {
  const bucket = useViewportBucket()
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = bucket === 'mobile'
  const isCompact = bucket === 'mobile' || bucket === 'tablet'

  const [videoItems, setVideoItems] = useState(
    VIDEO_IDS.map((id, index) => ({
      id,
      title: `Video ${index + 1}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      href: `https://www.youtube.com/watch?v=${id}`
    }))
  )
  const [displayCount, setDisplayCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  // Fetch real titles, preload every thumbnail so the gallery doesn't pop
  // in piecemeal, and only then reveal the page.
  useEffect(() => {
    let cancelled = false

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve
        img.src = src
        // Safety net in case neither event fires (flaky network etc.)
        window.setTimeout(resolve, 4000)
      })

    const run = async () => {
      const items = await Promise.all(
        VIDEO_IDS.map(async (id, index) => {
          const thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
          let title = `Video ${index + 1}`
          try {
            const response = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
            )
            if (response.ok) {
              const data = await response.json()
              title = data.title || title
            }
          } catch (error) {
            console.warn('Failed to fetch video title for', id, error)
          }
          return { id, title, thumbnail, href: `https://www.youtube.com/watch?v=${id}` }
        })
      )
      if (cancelled) return
      setVideoItems(items)

      const minDelay = new Promise((resolve) => window.setTimeout(resolve, 500))
      await Promise.all([Promise.all(items.map((item) => preloadImage(item.thumbnail))), minDelay])
      if (!cancelled) setIsReady(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  // Keep the loader mounted a little past isReady so its fade-out transition
  // can actually play before it's removed from the DOM.
  useEffect(() => {
    if (!isReady) return
    const t = window.setTimeout(() => setShowLoader(false), 520)
    return () => window.clearTimeout(t)
  }, [isReady])

  useEffect(() => {
    const t = window.setTimeout(() => setDisplayCount(subscriberData.subscriberCount), 80)
    return () => window.clearTimeout(t)
  }, [])

  // Subtle parallax on the hero background layers as the page scrolls.
  const heroLayerRef = useRef(null)
  const heroLayerSoftRef = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    let frame = null
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const y = window.scrollY
        if (heroLayerRef.current) heroLayerRef.current.style.transform = `translateY(${y * 0.12}px)`
        if (heroLayerSoftRef.current) heroLayerSoftRef.current.style.transform = `translateY(${y * -0.08}px)`
        frame = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  // One-time GSAP intro timeline for the hero, first load only (per browser
  // session — it won't replay on remounts within the same tab/session).
  const heroRef = useRef(null)
  useEffect(() => {
    if (reducedMotion || !isReady || !heroRef.current) return
    const alreadyPlayed = window.sessionStorage.getItem('heroIntroPlayed')
    if (alreadyPlayed) return

    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.js-hero-eyebrow', { opacity: 0, y: 16, duration: 0.6 })
        .from('.js-hero-title', { opacity: 0, y: 26, duration: 0.9 }, '-=0.35')
        .from('.js-hero-subtitle', { opacity: 0, y: 16, duration: 0.6 }, '-=0.5')
        .from('.js-hero-stat', { opacity: 0, y: 16, duration: 0.5, stagger: 0.12 }, '-=0.35')
        .from('.js-hero-panel', { opacity: 0, y: 20, scale: 0.97, duration: 0.7 }, '-=0.5')
    }, heroRef)

    window.sessionStorage.setItem('heroIntroPlayed', '1')
    return () => ctx.revert()
  }, [isReady, reducedMotion])

  const menuItems = useMemo(
    () => [
      { label: 'Home', ariaLabel: 'Jump to hero', link: '#hero' },
      { label: 'Videos', ariaLabel: 'Browse videos', link: '#videos' },
      { label: 'Support', ariaLabel: 'Visit support', link: '#support' },
      { label: 'Commissions', ariaLabel: 'View commissions', link: '#commissions' },
      { label: 'Contact', ariaLabel: 'Contact on Discord', link: '#contact' }
    ],
    []
  )

  const flowItems = useMemo(
    () =>
      videoItems.map((item) => ({
        link: item.href,
        text: item.title,
        image: item.thumbnail
      })),
    [videoItems]
  )

  const updatedAt = new Date(subscriberData.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const latestVideo = videoItems[0]

  // Responsive prop tables for components whose sizing is driven by JS
  // props rather than CSS (particle/ascii canvases, counter digits, dome).
  const titleParticleProps = {
    mobile: { particleSize: 2.6, density: 4, fontSize: '54px' },
    tablet: { particleSize: 2.8, density: 5, fontSize: '80px' },
    laptop: { particleSize: 3.2, density: 5.5, fontSize: '108px' },
    desktop: { particleSize: 3.6, density: 6, fontSize: '138px' }
  }[bucket]

  const accentAsciiProps = {
    tablet: { asciiFontSize: 2.8, textFontSize: 64 },
    laptop: { asciiFontSize: 3.4, textFontSize: 84 },
    desktop: { asciiFontSize: 4, textFontSize: 104 }
  }[bucket] ?? { asciiFontSize: 2.8, textFontSize: 64 }

  const counterProps = {
    mobile: { fontSize: 34, padding: 6, gap: 6, horizontalPadding: 10 },
    tablet: { fontSize: 46, padding: 8, gap: 8, horizontalPadding: 14 },
    laptop: { fontSize: 56, padding: 10, gap: 9, horizontalPadding: 16 },
    desktop: { fontSize: 64, padding: 12, gap: 10, horizontalPadding: 18 }
  }[bucket]

  const domeProps = {
    mobile: { minRadius: 220, openedImageWidth: '180px', openedImageHeight: '112px' },
    tablet: { minRadius: 320, openedImageWidth: '230px', openedImageHeight: '144px' },
    laptop: { minRadius: 400, openedImageWidth: '270px', openedImageHeight: '169px' },
    desktop: { minRadius: 460, openedImageWidth: '300px', openedImageHeight: '188px' }
  }[bucket]

  const sparkProps = isMobile
    ? { sparkSize: 12, sparkRadius: 22, sparkCount: 6 }
    : { sparkSize: 18, sparkRadius: 32, sparkCount: 10 }

  return (
    <div className="app">
      {showLoader && <LoadingScreen active={!isReady} />}

      <StaggeredMenu
        position="right"
        logoUrl={logoSrc}
        items={menuItems}
        displaySocials={false}
        displayItemNumbering={true}
        menuButtonColor="#fff"
        openMenuButtonColor="#ff3d47"
        changeMenuColorOnOpen={true}
        accentColor="#ff3d47"
        isFixed={true}
      />

      <main className="page">
        <section className="hero" id="hero" ref={heroRef}>
          <div className="heroLayer" ref={heroLayerRef} />
          <div className="heroLayer heroLayer--soft" ref={heroLayerSoftRef} />

          <ClickSpark sparkColor="#ff3d47" duration={520} {...sparkProps}>
            <div className="heroInner">
              <div className="heroContent">
                <div className="heroCopy">
                  <span className="eyebrow js-hero-eyebrow">Kinetic motion for bold ideas</span>
                  <div className="heroTitle js-hero-title">
                    <Shuffle
                      key={bucket}
                      text="Dhia_anims"
                      className="heroShuffle"
                      shuffleDirection="right"
                      duration={0.45}
                      maxDelay={0.2}
                      loop={true}
                      loopDelay={0.5}
                      colorFrom="#ff3d47"
                      colorTo="#ff3d47"
                      textAlign="left"
                      triggerOnHover={false}
                    />
                  </div>
                  <p className="heroSubtitle js-hero-subtitle">
                    Stick-figure animator delivering kinetic motion design, playful storytelling, and fast-paced
                    visual ideas.
                  </p>

                  <div className="heroStats">
                    <div className="statCard js-hero-stat">
                      <span className="statLabel">Subscribers</span>
                      <Counter
                        value={displayCount}
                        places={[100000, 10000, 1000, 100, 10, 1]}
                        borderRadius={16}
                        textColor="#ffffff"
                        fontWeight={900}
                        gradientFrom="rgba(255,255,255,0.08)"
                        gradientTo="transparent"
                        topGradientStyle={{ mixBlendMode: 'screen' }}
                        bottomGradientStyle={{ mixBlendMode: 'screen' }}
                        {...counterProps}
                      />
                      <span className="statMeta">Updated {updatedAt}</span>
                    </div>
                    <div className="statCard statCard--secondary js-hero-stat">
                      <span className="statLabel">Videos posted</span>
                      <span className="statValue">{videoItems.length}</span>
                      <span className="statMeta">Motion shorts & experiments</span>
                    </div>
                  </div>
                </div>

                <a className="heroVisual js-hero-panel" href={latestVideo?.href} target="_blank" rel="noreferrer">
                  <ElectricBorder color="#ff3d47" speed={1} chaos={0.12} thickness={2} style={{ borderRadius: 38 }}>
                    <div
                      className="heroPanel"
                      style={{
                        backgroundImage: latestVideo
                          ? `linear-gradient(180deg, rgba(9,7,12,0.1) 0%, rgba(9,7,12,0.55) 55%, rgba(9,7,12,0.95) 100%), url(${latestVideo.thumbnail})`
                          : undefined
                      }}
                    >
                      <span className="heroPanelLabel">Latest drop</span>
                      <span className="heroPanelText">{latestVideo?.title ?? 'New motion experiment'}</span>
                      <span className="heroPanelCta">Watch on YouTube →</span>
                    </div>
                  </ElectricBorder>
                </a>
              </div>
            </div>
          </ClickSpark>

          {!isMobile && (
            <Suspense fallback={null}>
              <div className="heroAccent">
                <AsciiText
                  text="ANIMATOR"
                  enableWaves={false}
                  textColor="rgba(255,255,255,0.5)"
                  planeBaseHeight={4}
                  {...accentAsciiProps}
                />
              </div>
            </Suspense>
          )}
        </section>

        <section className="section" id="videos">
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={4}
            blurStrength={10}
            wordAnimationEnd="bottom bottom"
          >
            Video showcase
          </ScrollReveal>
          <p className="sectionIntro">
            A dynamic collection of personal shorts, motion experiments, and stick-figure storytelling.
          </p>
          <div className="videoShowcase">
            <Reveal className="galleryWrap">
              <Suspense fallback={<div className="galleryFallback">Loading showcase…</div>}>
                <DomeGallery
                  images={videoItems.map((item) => ({ src: item.thumbnail, alt: item.title }))}
                  fit={0.8}
                  fitBasis="min"
                  imageBorderRadius="20px"
                  openedImageBorderRadius="26px"
                  grayscale={false}
                  {...domeProps}
                />
              </Suspense>
            </Reveal>
            {isMobile && (
              <div className="videoGrid">
                {videoItems.map((item, i) => (
                  <Reveal as="a" key={item.id} delay={i * 40} className="videoCard" href={item.href} target="_blank" rel="noreferrer">
                    <span className="videoCardThumb">
                      <img src={item.thumbnail} alt="" loading="lazy" />
                      <span className="videoCardPlay">
                        <PlayIcon />
                      </span>
                    </span>
                    <span className="videoCardTitle">{item.title}</span>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section" id="support">
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={4}
            blurStrength={10}
            wordAnimationEnd="bottom bottom"
          >
            Support & store
          </ScrollReveal>
          <div className="ctaGrid">
            {SUPPORT_LINKS.map((link, i) => {
              const Icon = link.icon
              return (
                <Reveal as="a" key={link.url} delay={i * 80} className="ctaCard" href={link.url} target="_blank" rel="noreferrer">
                  <span className="ctaCardHead">
                    {Icon && <Icon className="ctaIcon" />}
                    {link.title}
                  </span>
                  <p>{link.description}</p>
                </Reveal>
              )
            })}
          </div>
          {!isMobile && (
            <Reveal className="flowingPanel">
              <Suspense fallback={null}>
                <FlowingMenu
                  items={flowItems}
                  speed={16}
                  textColor="#ffffff"
                  bgColor="#09070c"
                  marqueeBgColor="#ff3d47"
                  marqueeTextColor="#050505"
                  borderColor="rgba(255,61,71,0.35)"
                />
              </Suspense>
            </Reveal>
          )}
        </section>

        <section className="section" id="commissions">
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={4}
            blurStrength={10}
            wordAnimationEnd="bottom bottom"
          >
            Commissions
          </ScrollReveal>
          <Reveal className="commissionCard">
            <div>
              <h3>Bring your idea to motion</h3>
              <p>
                I create fast-paced animation with a clean, kinetic line aesthetic. Available for short brand films,
                animated intros, and playful character work.
              </p>
            </div>
            <div className="commissionActions">
              {COMMISSION_PLATFORMS.map((platform) => {
                const Icon = platform.icon
                return (
                  <a key={platform.name} className="commissionAction" href={platform.url} target="_blank" rel="noreferrer">
                    <Icon className="commissionIcon" />
                    Book on {platform.name}
                  </a>
                )
              })}
            </div>
          </Reveal>
        </section>

        <footer className="section contactSection" id="contact">
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={4}
            blurStrength={10}
            wordAnimationEnd="bottom bottom"
          >
            Contact
          </ScrollReveal>
          <Reveal className="contactCard">
            <p className="contactLead">Let’s animate your next campaign, brand sequence, or kinetic story.</p>
            <p className="contactText">
              Discord tag <strong>dhia0259</strong> — available for commissions, collabs, and custom motion work. Fast
              replies for briefs and bookings.
            </p>
          </Reveal>
        </footer>
      </main>
    </div>
  )
}

export default App
