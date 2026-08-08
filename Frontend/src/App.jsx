import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import AsciiText from './reference_components/AsciiText.jsx'
import Counter from './reference_components/Counter.jsx'
import ClickSpark from './reference_components/ClickSpark.jsx'
import { StaggeredMenu } from './reference_components/StaggeredMenu.jsx'
import ScrollReveal from './reference_components/ScrollReveal.jsx'
import subscriberData from '../../data/subscribers.json'
import './App.css'
import logoSrc from '@root/assets/Logo.jpg'

const DomeGallery = lazy(() => import('./reference_components/DomeGallery.jsx'))
const FlowingMenu = lazy(() => import('./reference_components/FlowingMenu.jsx'))
const ParticleText = lazy(() => import('./reference_components/ParticleText.jsx'))

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

const SUPPORT_LINKS = [
  {
    title: 'Gumroad store',
    description: 'Own animation toolkits, presets, and motion art.',
    url: 'https://medhianaffeti.gumroad.com/'
  },
  {
    title: 'Buy me a coffee',
    description: 'Support the channel and fuel the next motion experiment.',
    url: 'https://medhianaffeti.gumroad.com/coffee'
  }
]

const COMMISSIONS_URL = 'https://www.fiverr.com/s/wkaQl7o'

// Simple original line icons (not the trademarked platform logos) so each
// commission button reads clearly at a glance.
function GigIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <path d="M3 12.5c2.8 1.4 5.8 2 9 2s6.2-.6 9-2" />
    </svg>
  )
}

function HandshakeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11l4-4 5 3 3-2 6 4-3 3-3-2-3 3-6-3-3 2z" />
      <path d="M8 10l4 4" />
      <path d="M13 8l4 4" />
    </svg>
  )
}

// Add an Upwork entry here once you have the gig URL, e.g.
// { name: 'Upwork', url: 'https://www.upwork.com/...', icon: HandshakeIcon }
const COMMISSION_PLATFORMS = [{ name: 'Fiverr', url: COMMISSIONS_URL, icon: GigIcon }]

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

  useEffect(() => {
    const loadTitles = async () => {
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
          return {
            id,
            title,
            thumbnail,
            href: `https://www.youtube.com/watch?v=${id}`
          }
        })
      )
      setVideoItems(items)
    }
    loadTitles()
  }, [])

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
  // props rather than CSS (ascii/particle canvases, counter digits, dome).
  const asciiProps = {
    mobile: { asciiFontSize: 3, textFontSize: 150 },
    tablet: { asciiFontSize: 5.4, textFontSize: 140 },
    laptop: { asciiFontSize: 10, textFontSize: 180 },
    desktop: { asciiFontSize: 5, textFontSize: 250 }
  }[bucket]

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
        <section className="hero" id="hero">
          <div className="heroLayer" ref={heroLayerRef} />
          <div className="heroLayer heroLayer--soft" ref={heroLayerSoftRef} />

          <ClickSpark sparkColor="#ff3d47" duration={520} {...sparkProps}>
            <div className="heroInner">
              <div className="heroContent">
                <div className="heroCopy">
                  <span className="eyebrow">Kinetic motion for bold ideas</span>
                  <div className="heroTitle">
                    <AsciiText
                      text="Dhia_anims"
                      enableWaves={true}
                      textColor="#ff3d47"
                      planeBaseHeight={isMobile ? 4 : 5}
                      {...asciiProps}
                    />
                  </div>
                  <p className="heroSubtitle">
                    Stick-figure animator delivering kinetic motion design, playful storytelling, and fast-paced
                    visual ideas.
                  </p>

                  <div className="heroStats">
                    <div className="statCard">
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
                    <div className="statCard statCard--secondary">
                      <span className="statLabel">Videos posted</span>
                      <span className="statValue">{videoItems.length}</span>
                      <span className="statMeta">Motion shorts & experiments</span>
                    </div>
                  </div>
                </div>

                <a className="heroVisual" href={latestVideo?.href} target="_blank" rel="noreferrer">
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
                </a>
              </div>
            </div>
          </ClickSpark>

          {!isMobile && (
            <Suspense fallback={null}>
              <div className="heroAccent">
                <ParticleText
                  text="ANIMATOR"
                  particleSize={isCompact ? 2 : 3}
                  density={isCompact ? 3 : 5}
                  color="#ff3d47"
                  highlightColor="#ffffff"
                  scatter={80}
                  gatherDuration={1800}
                  fontSize="clamp(3rem, 12vw, 8rem)"
                  fontWeight={700}
                  className="particleText"
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
                  fit={1}
                  fitBasis="min"
                  imageBorderRadius="20px"
                  openedImageBorderRadius="26px"
                  grayscale={false}
                  {...domeProps}
                />
              </Suspense>
            </Reveal>
            <div className="videoGrid">
              {videoItems.map((item, i) => (
                <Reveal as="a" key={item.id} delay={i * 40} className="videoLink" href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.title}</span>
                  <small>{item.id}</small>
                </Reveal>
              ))}
            </div>
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
            {SUPPORT_LINKS.map((link, i) => (
              <Reveal as="a" key={link.url} delay={i * 80} className="ctaCard" href={link.url} target="_blank" rel="noreferrer">
                <span>{link.title}</span>
                <p>{link.description}</p>
              </Reveal>
            ))}
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
            <div>
              <p className="contactLead">Let’s animate your next campaign, brand sequence, or kinetic story.</p>
              <p className="contactText">
                Discord tag <strong>dhia0259</strong> — available for commissions, collabs, and custom motion work.
              </p>
            </div>
            <div className="contactActions">
              <a className="contactButton" href="mailto:hello@dhiaanims.com">
                Email hello@dhiaanims.com
              </a>
              <span className="contactNote">Fast replies via Discord or email for briefs and bookings.</span>
            </div>
          </Reveal>
        </footer>
      </main>
    </div>
  )
}

export default App
