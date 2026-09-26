import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './style.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sceneOpacityFactor = () => window.innerWidth <= 1180 ? .46 : 1
const preloader = document.querySelector('.preloader')
const sceneState = { activeSection: 'none', homeActive: false, aboutActive: false, servicesActive: false, featureActive: false, languageActive: false, workActive: false, idle: false }
let sceneInactivityTimer
const sceneIdleDelay = 12000

const resetSceneInactivity = () => {
  sceneState.idle = false
  window.clearTimeout(sceneInactivityTimer)
  sceneInactivityTimer = window.setTimeout(() => { sceneState.idle = true }, sceneIdleDelay)
}

const updateSceneState = () => {
  const home = document.querySelector('#home')
  const about = document.querySelector('#about')
  const services = document.querySelector('#services')
  const feature = document.querySelector('.feature-story')
  const language = document.querySelector('.language-section')
  const work = document.querySelector('#work')
  const focusLine = window.innerHeight * .46
  const isAtFocusLine = (section) => {
    if (!section) return false
    const bounds = section.getBoundingClientRect()
    return bounds.top <= focusLine && bounds.bottom >= focusLine
  }
  sceneState.homeActive = isAtFocusLine(home)
  sceneState.aboutActive = isAtFocusLine(about)
  sceneState.featureActive = isAtFocusLine(feature)
  sceneState.languageActive = isAtFocusLine(language)
  sceneState.workActive = isAtFocusLine(work)
  sceneState.servicesActive = isAtFocusLine(services) && !sceneState.languageActive
  sceneState.activeSection = sceneState.homeActive ? 'home' : sceneState.aboutActive ? 'about' : sceneState.languageActive ? 'language' : sceneState.servicesActive ? 'services' : sceneState.featureActive ? 'feature' : sceneState.workActive ? 'work' : 'none'
}

window.addEventListener('scroll', updateSceneState, { passive: true })
window.addEventListener('scroll', resetSceneInactivity, { passive: true })
updateSceneState()
resetSceneInactivity()

function initServicesCarousel() {
  const carousel = document.querySelector('[data-services-carousel]')
  if (!carousel) return
  const track = carousel.querySelector('.service-cards')
  const cards = [...carousel.querySelectorAll('.service-card')]
  const previous = carousel.querySelector('.service-carousel__arrow--prev')
  const next = carousel.querySelector('.service-carousel__arrow--next')
  if (!track || cards.length < 2) return
  if (previous) previous.textContent = String.fromCodePoint(0x2190, 0xfe0e)
  if (next) next.textContent = String.fromCodePoint(0x2192, 0xfe0e)

  let activeIndex = 0
  let autoTimer
  let resumeTimer
  let pointerStartX = null

  const render = () => {
    const step = Math.min(300, Math.max(170, carousel.clientWidth * .36))
    const total = cards.length
    cards.forEach((card, cardIndex) => {
      let offset = cardIndex - activeIndex
      if (offset > total / 2) offset -= total
      if (offset < -total / 2) offset += total
      const distance = Math.abs(offset)
      const scale = offset === 0 ? 1 : Math.max(.68, 1 - distance * .13)
      const opacity = offset === 0 ? 1 : Math.max(.12, 1 - distance * .38)
      const blur = offset === 0 ? 0 : Math.min(10, distance * 5)
      card.style.transform = `translate(-50%, -50%) translateX(${offset * step}px) scale(${scale})`
      card.style.opacity = opacity
      card.style.filter = `blur(${blur}px)`
      card.style.zIndex = String(10 - distance)
      card.style.pointerEvents = offset === 0 ? 'auto' : 'none'
      card.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true')
    })
  }

  const startAuto = () => {
    window.clearInterval(autoTimer)
    autoTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % cards.length
      render()
    }, 3600)
  }

  const resumeAuto = () => {
    window.clearTimeout(resumeTimer)
    resumeTimer = window.setTimeout(startAuto, 3600)
  }

  const move = (direction) => {
    activeIndex = (activeIndex + direction + cards.length) % cards.length
    render()
    window.clearInterval(autoTimer)
    resumeAuto()
  }

  previous?.addEventListener('click', () => move(-1))
  next?.addEventListener('click', () => move(1))
  carousel.addEventListener('pointerdown', (event) => { pointerStartX = event.clientX; window.clearInterval(autoTimer) })
  carousel.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return
    const distance = event.clientX - pointerStartX
    pointerStartX = null
    if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1)
    else resumeAuto()
  })
  carousel.addEventListener('pointercancel', () => { pointerStartX = null; resumeAuto() })
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') move(-1)
    if (event.key === 'ArrowRight') move(1)
  })
  window.addEventListener('resize', render)
  render()
  startAuto()
}

function initLanguageInteractions() {
  const cards = [...document.querySelectorAll('.language-card')]
  if (!cards.length) return

  cards.forEach((card) => {
    const icon = card.querySelector('.language-icon')
    if (!icon) return
    card.setAttribute('role', 'button')
    card.setAttribute('tabindex', '0')
    let isAnimating = false

    const activate = () => {
      if (isAnimating) return
      isAnimating = true
      document.querySelectorAll('.language-particle').forEach((particle) => particle.remove())
      const bounds = icon.getBoundingClientRect()
      const style = getComputedStyle(icon)
      const particleBackground = style.backgroundImage !== 'none' ? style.backgroundImage : style.backgroundColor
      const languageKey = card.querySelector('h4')?.textContent.trim().toLowerCase().replace('javascript', 'javascript').replace('typescript', 'typescript').replace('c++', 'cpp')
      const particles = []
      const sourcePositions = []
      const destinations = []
      const particleCount = 24

      cards.forEach((otherCard) => otherCard.querySelector('.language-icon')?.classList.remove('is-3d'))
      window.dispatchEvent(new CustomEvent('language:selected', { detail: { key: languageKey } }))
      icon.classList.add('is-animating')
      icon.classList.remove('is-3d')
      icon.style.opacity = '0'
      for (let index = 0; index < particleCount; index += 1) {
        const source = {
          x: bounds.left + Math.random() * bounds.width,
          y: bounds.top + Math.random() * bounds.height,
        }
        const destination = {
          x: source.x + (Math.random() - .5) * 130,
          y: source.y + (Math.random() - .5) * 130,
        }
        const particle = document.createElement('i')
        particle.className = 'language-particle'
        particle.style.background = particleBackground
        particle.style.left = `${source.x}px`
        particle.style.top = `${source.y}px`
        particle.style.setProperty('--particle-size', `${3 + Math.random() * 4}px`)
        document.body.appendChild(particle)
        particles.push(particle)
        sourcePositions.push(source)
        destinations.push(destination)
      }

      const startedAt = performance.now()
      const scatterDuration = 520
      const pauseDuration = 120
      const returnDuration = 1150
      const animate = (now) => {
        const elapsed = now - startedAt
        const returnProgress = Math.max(0, Math.min(1, (elapsed - scatterDuration - pauseDuration) / returnDuration))
        const scatterProgress = Math.max(0, Math.min(1, elapsed / scatterDuration))
        const scatterEase = scatterProgress * scatterProgress * (3 - 2 * scatterProgress)
        const returnEase = returnProgress * returnProgress * (3 - 2 * returnProgress)
        particles.forEach((particle, index) => {
          const source = sourcePositions[index]
          const destination = destinations[index]
          const progress = elapsed < scatterDuration ? scatterEase : returnEase
          const from = elapsed < scatterDuration ? source : destination
          const to = elapsed < scatterDuration ? destination : source
          particle.style.transform = `translate(${from.x + (to.x - from.x) * progress - source.x}px,${from.y + (to.y - from.y) * progress - source.y}px) scale(${elapsed < scatterDuration ? 1.15 : .9 + returnEase * .1})`
          particle.style.opacity = elapsed < scatterDuration ? String(1 - scatterEase * .3) : String(.7 + returnEase * .3)
        })
        if (elapsed < scatterDuration + pauseDuration + returnDuration) {
          window.requestAnimationFrame(animate)
          return
        }
        particles.forEach((particle) => particle.remove())
        icon.style.opacity = ''
        icon.classList.remove('is-animating')
        isAnimating = false
      }
      window.requestAnimationFrame(animate)
    }

    card.addEventListener('click', activate)
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      activate()
    })
  })
}

function replaceFeatureCards() {
  const rows = [...document.querySelectorAll('.feature-story .feature-row')]
  const statements = [
    {
      label: '01 / SIGNAL',
      title: 'Rendre l’information immédiatement lisible.',
      text: 'Je transforme les flux complexes en repères simples : les bons signaux, au bon moment, pour décider avec confiance.',
      note: 'ANALYSE · CLARTÉ · DÉCISION',
    },
    {
      label: '02 / AUTOMATISATION',
      title: 'Donner aux équipes plus de temps pour penser.',
      text: 'Je conçois des systèmes qui absorbent la répétition, apprennent du terrain et laissent aux équipes l’espace pour créer de la valeur.',
      note: 'WORKFLOWS · IA · IMPACT',
    },
  ]

  rows.forEach((row, index) => {
    const card = row.querySelector('.feature-art')
    const content = statements[index]
    if (!card || !content) return
    const statement = document.createElement('div')
    statement.className = 'feature-row__statement'
    statement.innerHTML = `<span>${content.label}</span><h3>${content.title}</h3><p>${content.text}</p><small>${content.note}</small>`
    card.replaceWith(statement)
  })
}

function initGrokScene() {
  const main = document.querySelector('main')
  if (!main || document.querySelector('.grok-scene--page')) return

  const layer = document.createElement('div')
  layer.className = 'grok-scene grok-scene--page'
  layer.setAttribute('aria-hidden', 'true')
  layer.innerHTML = '<div class="grok-scene__halo"></div><img src="https://upload.wikimedia.org/wikipedia/commons/f/f4/Grok_logo_without_text.svg" alt="Icône Grok" />'
  main.prepend(layer)
  const image = layer.querySelector('img')

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let opacity = 0
  let frame = 0
  let bursting = false
  const render = (time = 0) => {
    pointer.x += (target.x - pointer.x) * .06
    pointer.y += (target.y - pointer.y) * .06
    const active = sceneState.workActive && !sceneState.idle
    const targetOpacity = active || (sceneState.idle && !sceneState.languageActive) ? .7 * sceneOpacityFactor() : 0
    opacity += (targetOpacity - opacity) * .09
    layer.style.opacity = opacity.toFixed(3)
    layer.style.setProperty('--grok-x', `${pointer.x * 18}px`)
    layer.style.setProperty('--grok-y', `${pointer.y * 14 + Math.sin(time * .001 * .7) * 5}px`)
    if (image && !bursting) image.style.transform = `translate3d(${pointer.x * 10}px,${pointer.y * 8}px,0) rotate(${pointer.x * 8 - 8}deg) rotateY(${pointer.x * 12}deg)`
    if (!reduceMotion) frame = window.requestAnimationFrame(render)
  }
  window.addEventListener('pointermove', (event) => {
    target.x = (event.clientX / window.innerWidth - .5) * 2
    target.y = (event.clientY / window.innerHeight - .5) * -2
  })
  image?.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (bursting || opacity < .1) return
    bursting = true
    const bounds = image.getBoundingClientRect()
    const particles = []
    const sources = []
    const destinations = []
    const particleCount = 34
    const colors = ['#ffffff', '#d7ddff', '#aab8ff', '#7f91ff']
    image.style.opacity = '0'
    for (let index = 0; index < particleCount; index += 1) {
      const source = { x: bounds.left + Math.random() * bounds.width, y: bounds.top + Math.random() * bounds.height }
      const destination = { x: source.x + (Math.random() - .5) * 250, y: source.y + (Math.random() - .5) * 250 }
      const particle = document.createElement('i')
      particle.className = 'grok-particle'
      particle.style.background = colors[index % colors.length]
      particle.style.left = `${source.x}px`
      particle.style.top = `${source.y}px`
      particle.style.setProperty('--grok-particle-size', `${3 + Math.random() * 5}px`)
      document.body.appendChild(particle)
      particles.push(particle)
      sources.push(source)
      destinations.push(destination)
    }
    const startedAt = performance.now()
    const scatterDuration = 620
    const pauseDuration = 160
    const returnDuration = 2100
    const animate = (now) => {
      const elapsed = now - startedAt
      const scatterProgress = Math.max(0, Math.min(1, elapsed / scatterDuration))
      const returnProgress = Math.max(0, Math.min(1, (elapsed - scatterDuration - pauseDuration) / returnDuration))
      const scatterEase = scatterProgress * scatterProgress * (3 - 2 * scatterProgress)
      const returnEase = returnProgress * returnProgress * (3 - 2 * returnProgress)
      particles.forEach((particle, index) => {
        const source = sources[index]
        const destination = destinations[index]
        const progress = elapsed < scatterDuration ? scatterEase : returnEase
        const from = elapsed < scatterDuration ? source : destination
        const to = elapsed < scatterDuration ? destination : source
        particle.style.transform = `translate(${from.x + (to.x - from.x) * progress - source.x}px,${from.y + (to.y - from.y) * progress - source.y}px) scale(${elapsed < scatterDuration ? 1.2 : .85 + returnEase * .15})`
        particle.style.opacity = elapsed < scatterDuration ? String(1 - scatterEase * .3) : String(.7 + returnEase * .3)
      })
      if (elapsed < scatterDuration + pauseDuration + returnDuration) {
        window.requestAnimationFrame(animate)
        return
      }
      particles.forEach((particle) => particle.remove())
      image.style.opacity = ''
      bursting = false
    }
    window.requestAnimationFrame(animate)
  })
  window.addEventListener('pointerdown', (event) => {
    if (!image || event.button !== 0 || bursting || opacity < .1) return
    const bounds = image.getBoundingClientRect()
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom
    if (!inside) return
    image.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY }))
  }, true)
  render()
  return () => window.cancelAnimationFrame(frame)
}

function initContactForm() {
  document.querySelector('.plans')?.remove()
  const content = document.querySelector('.contact__content')
  if (!content || content.querySelector('.contact-form')) return

  const form = document.createElement('form')
  form.className = 'contact-form'
  form.innerHTML = `
    <div class="contact-form__row">
      <label><span>Nom</span><input name="name" type="text" autocomplete="name" placeholder="Votre nom" required /></label>
      <label><span>E-mail</span><input name="email" type="email" autocomplete="email" placeholder="vous@entreprise.com" required /></label>
    </div>
    <label><span>Sujet</span><input name="subject" type="text" placeholder="Parlons de votre projet" required /></label>
    <label><span>Message</span><textarea name="message" rows="4" placeholder="Décrivez votre besoin en quelques lignes…" required></textarea></label>
    <div class="contact-form__footer"><button class="button button--large" type="submit">Envoyer le message <span>↗</span></button><small class="contact-form__status" aria-live="polite"></small></div>
  `
  content.append(form)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const values = new FormData(form)
    const name = String(values.get('name') || '')
    const email = String(values.get('email') || '')
    const subject = String(values.get('subject') || '')
    const message = String(values.get('message') || '')
    const body = `Bonjour Marie-Christy MONTEIRO,\n\nJe m'appelle ${name} (${email}).\n\n${message}`
    const status = form.querySelector('.contact-form__status')
    if (status) status.textContent = 'Ouverture de votre messagerie…'
    window.location.href = `mailto:hello@naurale.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })
}

function initLanguageSwitcher() {
  const topbar = document.querySelector('.topbar')
  if (!topbar || topbar.querySelector('.language-switcher')) return

  const switcher = document.createElement('div')
  switcher.className = 'language-switcher'
  switcher.setAttribute('aria-label', 'Choisir la langue')
  switcher.innerHTML = '<button type="button" data-language-choice="fr" aria-label="Français" title="Français">FR</button><button type="button" data-language-choice="en" aria-label="English" title="English">EN</button>'
  const nav = topbar.querySelector('.nav')
  if (nav) nav.prepend(switcher)
  else topbar.append(switcher)

  const text = (selector, values, html = false) => {
    const elements = [...document.querySelectorAll(selector)]
    const list = Array.isArray(values) ? values : elements.map(() => values)
    elements.forEach((element, index) => {
      const value = list[index]
      if (value === undefined) return
      if (html) element.innerHTML = value
      else element.textContent = value
    })
  }

  const translations = {
    fr: {
      brand: 'MONTEIRO',
      nav: ['Accueil', 'Profil', 'Expertise', 'Projets', 'Contact'],
      logo: 'DATA & IA',
      talk: 'Échanger <span>↗</span>',
      preloader: 'Chargement de l’intelligence / 001',
      heroTitle: 'Données<br /><span>Intelligence</span><br />Impact réel',
      heroLead: 'Je transforme les données et l’intelligence artificielle en décisions claires, systèmes utiles et expériences qui font avancer les organisations.',
      heroAction: 'Voir mes projets <span>↗</span>',
      aboutLabel: 'Mon approche',
      aboutEyebrow: 'MARIE-CHRISTY MONTEIRO / DATA & IA',
      aboutTitle: 'Je transforme les données<br /><em>en intelligence utile.</em>',
      aboutText: [
        'Je m’appelle Marie-Christy MONTEIRO. Je suis experte en data et en intelligence artificielle. J’aide les organisations à comprendre leurs données, à révéler les opportunités qu’elles contiennent et à construire des solutions réellement utiles.',
        'Mon approche relie la stratégie, la technologie et l’humain pour transformer les sujets complexes en décisions claires, en systèmes intelligents et en impact durable.',
      ],
      aboutLink: 'Découvrir mon expertise <span>↗</span>',
      dashboardEyebrow: 'DATA & INTELLIGENCE ARTIFICIELLE',
      dashboardTitle: 'Je transforme les données<br /><em>en décisions claires.</em>',
      dashboardStatus: 'Systèmes opérationnels',
      dashboardPanel: ['Évolution des projets', 'Domaines d’expertise'],
      dashboardSmall: ['12 derniers mois ↗', '04 actifs'],
      signals: ['Stratégie data', 'IA générative', 'Automatisation', 'Recherche & innovation'],
      servicesLabel: 'Expertise',
      servicesEyebrow: 'COMPÉTENCES / 04',
      servicesTitle: 'Une expertise <em>qui crée de l’impact.</em>',
      serviceNames: ['Stratégie data', 'Systèmes intelligents', 'IA générative', 'Ateliers & formation'],
      serviceTexts: [
        'Identifier les bonnes opportunités et transformer une vision en feuille de route concrète.',
        'Concevoir des workflows qui permettent aux équipes de travailler mieux et plus vite.',
        'Mettre l’intelligence générative au service de la création, de l’analyse et de l’innovation.',
        'Faire monter les équipes en compétence avec des sessions pratiques et accessibles.',
      ],
      discover: 'Découvrir <b>↗</b>',
      languagesEyebrow: 'LANGAGES / DATA & IA',
      languagesTitle: 'Les langages qui <em>font avancer l’intelligence.</em>',
      languagesCount: '08 PRINCIPAUX',
      languageTexts: ['Analyse, modèles & automatisation', 'Données, requêtes & pipelines', 'Statistiques & visualisation', 'Interfaces & IA appliquée', 'Systèmes web fiables', 'Outils, serveurs & déploiement', 'Performance & calcul intensif', 'Calcul scientifique & recherche'],
      featureLabel: 'Ce que la data rend possible',
      featureEyebrows: ['ANALYSE INTELLIGENTE', 'WORKFLOWS AUTOMATISÉS'],
      featureTitles: ['Voir le signal<br /><em>dans le bruit.</em>', 'Libérer du temps<br /><em>pour l’essentiel.</em>'],
      featureTexts: ['Comprendre ce qui change, pourquoi c’est important et où se trouve réellement l’opportunité.', 'Construire des systèmes qui apprennent de vos équipes et font avancer les tâches importantes.'],
      featureLink: 'En savoir plus <span>↗</span>',
      statements: [
        ['01 / SIGNAL', 'Rendre l’information immédiatement lisible.', 'Je transforme les flux complexes en repères simples : les bons signaux, au bon moment, pour décider avec confiance.', 'ANALYSE · CLARTÉ · DÉCISION'],
        ['02 / AUTOMATISATION', 'Donner aux équipes plus de temps pour penser.', 'Je conçois des systèmes qui absorbent la répétition, apprennent du terrain et laissent aux équipes l’espace pour créer de la valeur.', 'WORKFLOWS · IA · IMPACT'],
      ],
      workLabel: 'Projets sélectionnés',
      workEyebrow: 'ÉTUDES DE CAS / SÉLECTION',
      workTitle: 'Des solutions<br /><em>pour le réel.</em>',
      workNote: 'Une sélection de systèmes, d’expériences et de décisions qui rendent l’avenir plus simple et plus utile.',
      caseType: 'OPÉRATIONS IA / 2025',
      caseTitle: 'Donner aux équipes<br />une vision claire.',
      caseText: 'Transformer un système de connaissance complexe en espace de travail calme et intelligent.',
      caseLink: 'Voir le projet <span>↗</span>',
      smallTypes: ['SYSTÈMES GÉNÉRATIFS', 'TRANSMISSION & IA'],
      smallTitles: ['Donner un langage<br />aux données.', 'Rendre l’inconnu<br />accessible.'],
      smallLinks: ['Lire le projet ↗', 'Lire le projet ↗'],
      contactEyebrow: 'Disponible pour de nouvelles collaborations',
      contactTitle: 'Une idée à explorer ?<br /><em>Construisons la suite.</em>',
      contactLead: 'Je m’appelle Marie-Christy MONTEIRO. Je suis experte en data et en intelligence artificielle. Écrivez-moi pour transformer une question complexe en direction concrète.',
      contactBackground: 'Donner du sens<br />à vos données.',
      chartAxis: ['JAN', 'MAR', 'MAI', 'JUIL', 'SEP', 'AUJ'],
      miniHeadline: 'Vos données,<br /><strong>plus lisibles.</strong>',
      flowNodes: ['Entrée', 'IA', 'Résultat'],
      orb: 'IA',
      carouselPrevious: 'Compétence précédente', carouselNext: 'Compétence suivante',
      form: { name: 'Nom', email: 'E-mail', subject: 'Sujet', message: 'Message', namePlaceholder: 'Votre nom', emailPlaceholder: 'vous@entreprise.com', subjectPlaceholder: 'Parlons de votre projet', messagePlaceholder: 'Décrivez votre besoin en quelques lignes…', button: 'Envoyer le message <span>↗</span>' },
      footer: ['MARIE-CHRISTY MONTEIRO © 2026', 'Data · IA · Impact', 'Retour en haut ↑'],
      mobileMenu: 'MONTEIRO / MENU', mobileClose: 'Fermer le menu', mobileLanguage: 'LANGUE', mobileTheme: 'THÈME',
    },
    en: {
      brand: 'MONTEIRO',
      nav: ['Home', 'Profile', 'Expertise', 'Projects', 'Contact'],
      logo: 'DATA & AI',
      talk: 'Let’s talk <span>↗</span>',
      preloader: 'Loading intelligence / 001',
      heroTitle: 'Data<br /><span>Intelligence</span><br />Real impact',
      heroLead: 'I turn data and artificial intelligence into clear decisions, useful systems and experiences that move organizations forward.',
      heroAction: 'View my projects <span>↗</span>',
      aboutLabel: 'My approach',
      aboutEyebrow: 'MARIE-CHRISTY MONTEIRO / DATA & AI',
      aboutTitle: 'I turn data<br /><em>into useful intelligence.</em>',
      aboutText: [
        'My name is Marie-Christy MONTEIRO. I am a data and artificial intelligence expert. I help organizations understand their data, reveal the opportunities within it and build solutions that are genuinely useful.',
        'My approach connects strategy, technology and people to turn complex subjects into clear decisions, intelligent systems and lasting impact.',
      ],
      aboutLink: 'Discover my expertise <span>↗</span>',
      dashboardEyebrow: 'DATA & ARTIFICIAL INTELLIGENCE',
      dashboardTitle: 'I turn data<br /><em>into clear decisions.</em>',
      dashboardStatus: 'Systems online',
      dashboardPanel: ['Project momentum', 'Areas of expertise'],
      dashboardSmall: ['Last 12 months ↗', '04 active'],
      signals: ['Data strategy', 'Generative AI', 'Automation', 'Research & innovation'],
      servicesLabel: 'Expertise',
      servicesEyebrow: 'CAPABILITIES / 04',
      servicesTitle: 'Expertise <em>that creates impact.</em>',
      serviceNames: ['Data strategy', 'Intelligent systems', 'Generative AI', 'Workshops & training'],
      serviceTexts: ['Identify the right opportunities and turn a vision into a concrete roadmap.', 'Design workflows that help teams work better and faster.', 'Put generative intelligence to work for creation, analysis and innovation.', 'Help teams build confidence with practical, accessible sessions.'],
      discover: 'Discover <b>↗</b>',
      languagesEyebrow: 'LANGUAGES / DATA & AI',
      languagesTitle: 'The languages that <em>move intelligence forward.</em>',
      languagesCount: '08 CORE',
      languageTexts: ['Analysis, models & automation', 'Data, queries & pipelines', 'Statistics & visualization', 'Interfaces & applied AI', 'Reliable web systems', 'Tools, servers & deployment', 'Performance & intensive computing', 'Scientific computing & research'],
      featureLabel: 'What data makes possible',
      featureEyebrows: ['INTELLIGENT ANALYSIS', 'AUTOMATED WORKFLOWS'],
      featureTitles: ['See the signal<br /><em>in the noise.</em>', 'Free up time<br /><em>for what matters.</em>'],
      featureTexts: ['Understand what changes, why it matters and where the real opportunity lies.', 'Build systems that learn from your teams and move important work forward.'],
      featureLink: 'Learn more <span>↗</span>',
      statements: [
        ['01 / SIGNAL', 'Make information immediately legible.', 'I turn complex flows into simple reference points: the right signals, at the right time, for confident decisions.', 'ANALYSIS · CLARITY · DECISION'],
        ['02 / AUTOMATION', 'Give teams more time to think.', 'I design systems that absorb repetition, learn from the field and give teams room to create value.', 'WORKFLOWS · AI · IMPACT'],
      ],
      workLabel: 'Selected projects',
      workEyebrow: 'CASE STUDIES / SELECTION',
      workTitle: 'Solutions<br /><em>for the real world.</em>',
      workNote: 'A selection of systems, experiences and decisions that make the future simpler and more useful.',
      caseType: 'AI OPERATIONS / 2025',
      caseTitle: 'Give teams<br />a clear view.',
      caseText: 'Turn a complex knowledge system into a calm, intelligent workspace.',
      caseLink: 'View project <span>↗</span>',
      smallTypes: ['GENERATIVE SYSTEMS', 'TRANSMISSION & AI'],
      smallTitles: ['Give data a language.', 'Make the unknown accessible.'],
      smallLinks: ['Read project ↗', 'Read project ↗'],
      contactEyebrow: 'Available for new collaborations',
      contactTitle: 'An idea to explore?<br /><em>Let’s build what’s next.</em>',
      contactLead: 'My name is Marie-Christy MONTEIRO. I am a data and artificial intelligence expert. Write to me to turn a complex question into a clear direction.',
      contactBackground: 'Give your data<br />meaning.',
      chartAxis: ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOW'],
      miniHeadline: 'Your data,<br /><strong>more legible.</strong>',
      flowNodes: ['Input', 'AI', 'Output'],
      orb: 'AI',
      carouselPrevious: 'Previous capability', carouselNext: 'Next capability',
      form: { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message', namePlaceholder: 'Your name', emailPlaceholder: 'you@company.com', subjectPlaceholder: 'Let’s talk about your project', messagePlaceholder: 'Describe what you need in a few lines…', button: 'Send message <span>↗</span>' },
      footer: ['MARIE-CHRISTY MONTEIRO © 2026', 'Data · AI · Impact', 'Back to top ↑'],
      mobileMenu: 'MONTEIRO / MENU', mobileClose: 'Close menu', mobileLanguage: 'LANGUAGE', mobileTheme: 'THEME',
    },
  }

  const applyLanguage = (language) => {
    const selected = language === 'en' ? 'en' : 'fr'
    const t = translations[selected]
    window.__nauraleLanguage = selected
    document.documentElement.lang = selected
    window.localStorage.setItem('naurale-language', selected)
    switcher.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.languageChoice === selected)))
    const logoBrand = document.querySelector('.logo strong')
    const preloaderBrand = document.querySelector('.preloader__brand')
    if (logoBrand) logoBrand.textContent = t.brand
    if (preloaderBrand) preloaderBrand.innerHTML = `<span></span>${t.brand}`
    text('.logo small', t.logo)
    text('.nav__link', t.nav)
    text('.topbar > a.button--small', t.talk, true)
    text('.preloader small', t.preloader)
    text('.hero__title', t.heroTitle, true)
    text('.hero__lead', t.heroLead)
    text('.hero__actions .button', t.heroAction, true)
    text('#about .section-label p', t.aboutLabel)
    text('.speech-block .eyebrow', t.aboutEyebrow)
    text('.speech-block h2', t.aboutTitle, true)
    text('.speech-block__text', t.aboutText)
    text('.speech-block .quiet-link', t.aboutLink, true)
    text('.dashboard__header .eyebrow', t.dashboardEyebrow)
    text('.dashboard__header h2', t.dashboardTitle, true)
    const statusPill = document.querySelector('.status-pill')
    if (statusPill) statusPill.innerHTML = `<i></i>${t.dashboardStatus}`
    text('.panel__top > span', t.dashboardPanel)
    text('.panel__top small', t.dashboardSmall)
    text('.signal-list li > span', t.signals)
    text('#services > .section-label p', t.servicesLabel)
    text('.services__intro .eyebrow', t.servicesEyebrow)
    text('.services__intro h2', t.servicesTitle, true)
    text('.service-card h3', t.serviceNames)
    text('.service-card p', t.serviceTexts)
    text('.service-card a', t.discover, true)
    text('.language-section__heading .eyebrow', t.languagesEyebrow)
    text('.language-section__heading h3', t.languagesTitle, true)
    text('.language-section__count', t.languagesCount)
    text('.language-card p', t.languageTexts)
    text('.feature-story > .section-label p', t.featureLabel)
    text('.feature-row__copy .eyebrow', t.featureEyebrows)
    text('.feature-row__copy h2', t.featureTitles, true)
    text('.feature-row__copy > p:not(.eyebrow)', t.featureTexts)
    text('.feature-row__copy .quiet-link', [t.featureLink, t.featureLink], true)
    document.querySelectorAll('.feature-row__statement').forEach((statement, index) => {
      const values = t.statements[index]
      if (!values) return
      const statementParts = [statement.querySelector(':scope > span'), statement.querySelector('h3'), statement.querySelector('p'), statement.querySelector(':scope > small')]
      statementParts.forEach((part, partIndex) => { if (part) part.textContent = values[partIndex] })
    })
    text('#work > .section-label p', t.workLabel)
    text('.work__intro .eyebrow', t.workEyebrow)
    text('.work__intro h2', t.workTitle, true)
    text('.work__note', t.workNote)
    text('.case-study__type', t.caseType)
    text('.case-study--featured .case-study__copy h3', t.caseTitle, true)
    text('.case-study--featured .case-study__copy p', t.caseText)
    text('.case-study--featured .quiet-link', t.caseLink, true)
    text('.case-study__small-copy > span', t.smallTypes)
    text('.case-study__small-copy h3', t.smallTitles, true)
    text('.case-study__small-copy a', t.smallLinks)
    const contactEyebrow = document.querySelector('#contact .eyebrow')
    if (contactEyebrow) contactEyebrow.innerHTML = `<span class="eyebrow__dot"></span>${t.contactEyebrow}`
    text('#contact h2', t.contactTitle, true)
    text('.contact__lead', t.contactLead)
    const form = document.querySelector('.contact-form')
    if (form) {
      text('label span', [t.form.name, t.form.email, t.form.subject, t.form.message])
      const placeholders = [t.form.namePlaceholder, t.form.emailPlaceholder, t.form.subjectPlaceholder, t.form.messagePlaceholder]
      form.querySelectorAll('input, textarea').forEach((field, index) => { field.placeholder = placeholders[index] || '' })
      text('.contact-form button', t.form.button, true)
      const status = form.querySelector('.contact-form__status')
      if (status) status.textContent = ''
    }
    text('.footer span', t.footer.slice(0, 2))
    text('.footer a', t.footer[2])
    text('.contact__background', t.contactBackground, true)
    text('.chart__axis span', t.chartAxis)
    text('.mini-screen__headline', t.miniHeadline, true)
    text('.feature-art__node--one', t.flowNodes[0])
    text('.feature-art__node--two', t.flowNodes[1])
    text('.feature-art__node--three', t.flowNodes[2])
    text('.contact__orb span', t.orb)
    text('.mini-nav > span', t.brand)
    const previousArrow = document.querySelector('.service-carousel__arrow--prev')
    const nextArrow = document.querySelector('.service-carousel__arrow--next')
    if (previousArrow) previousArrow.setAttribute('aria-label', t.carouselPrevious)
    if (nextArrow) nextArrow.setAttribute('aria-label', t.carouselNext)
    const mobileTop = document.querySelector('.mobile-menu__top span')
    const mobileClose = document.querySelector('.mobile-menu__close')
    const mobileLanguage = document.querySelector('.mobile-menu__language > span')
    const mobileTheme = document.querySelector('.mobile-menu__theme > span')
    if (mobileTop) mobileTop.textContent = t.mobileMenu
    if (mobileClose) mobileClose.setAttribute('aria-label', t.mobileClose)
    if (mobileLanguage) mobileLanguage.textContent = t.mobileLanguage
    if (mobileTheme) mobileTheme.textContent = t.mobileTheme
    window.dispatchEvent(new CustomEvent('language:changed', { detail: { language: selected } }))
  }

  switcher.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.languageChoice)))
  applyLanguage(window.localStorage.getItem('naurale-language') || 'fr')
}

function initThemeSwitcher() {
  const topbar = document.querySelector('.topbar')
  if (!topbar || topbar.querySelector('.theme-switcher')) return

  const switcher = document.createElement('div')
  switcher.className = 'theme-switcher'
  switcher.setAttribute('aria-label', 'Choisir le thème')
  switcher.innerHTML = '<button type="button" data-theme-choice="light" aria-label="Thème clair" title="Thème clair">☼</button><button type="button" data-theme-choice="dark" aria-label="Thème sombre" title="Thème sombre">◐</button><button type="button" data-theme-choice="system" aria-label="Thème système" title="Thème système">◌</button>'
  topbar.append(switcher)

  const buttons = [...switcher.querySelectorAll('button')]
  const storedTheme = window.localStorage.getItem('naurale-theme') || 'light'
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)')
  const applyTheme = (theme) => {
    const selectedTheme = ['light', 'dark', 'system'].includes(theme) ? theme : 'light'
    document.documentElement.dataset.theme = selectedTheme
    const followsLight = selectedTheme === 'light' || (selectedTheme === 'system' && !systemPreference.matches)
    document.documentElement.classList.toggle('is-light-theme', followsLight)
    document.documentElement.style.colorScheme = selectedTheme === 'system' ? 'light dark' : selectedTheme
    window.localStorage.setItem('naurale-theme', selectedTheme)
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === selectedTheme)))
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: selectedTheme } }))
  }

  buttons.forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.themeChoice)))
  systemPreference.addEventListener?.('change', () => {
    if (document.documentElement.dataset.theme === 'system') applyTheme('system')
  })
  applyTheme(storedTheme)
}

function initMobileMenu() {
  const topbar = document.querySelector('.topbar')
  const nav = topbar?.querySelector('.nav')
  if (!topbar || !nav) return

  const toggle = document.createElement('button')
  toggle.className = 'mobile-menu-toggle'
  toggle.type = 'button'
  toggle.setAttribute('aria-label', 'Ouvrir le menu')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.innerHTML = '<i></i><i></i><i></i>'
  topbar.append(toggle)

  const menu = document.createElement('div')
  menu.className = 'mobile-menu'
  menu.innerHTML = '<div class="mobile-menu__backdrop"></div><div class="mobile-menu__panel"><div class="mobile-menu__top"><span>NAURALE / MENU</span><button class="mobile-menu__close" type="button" aria-label="Fermer le menu">×</button></div><nav class="mobile-menu__nav" aria-label="Navigation mobile"></nav><div class="mobile-menu__theme"><span>THÈME</span></div></div>'
  const mobileNav = menu.querySelector('.mobile-menu__nav')
  const mobileTheme = menu.querySelector('.mobile-menu__theme')
  const mobileSettings = document.createElement('div')
  mobileSettings.className = 'mobile-menu__settings'
  const mobileLanguage = document.createElement('div')
  mobileLanguage.className = 'mobile-menu__language'
  mobileLanguage.innerHTML = '<span>LANGUE</span>'
  const mobileThemeParent = mobileTheme.parentElement
  mobileThemeParent?.append(mobileSettings)
  mobileSettings.append(mobileLanguage, mobileTheme)
  let closeMenu = () => {}
  nav.querySelectorAll('.nav__link').forEach((link) => {
    const clone = link.cloneNode(true)
    clone.addEventListener('click', () => closeMenu())
    mobileNav.append(clone)
  })
  document.querySelectorAll('.theme-switcher button').forEach((button) => {
    const clone = button.cloneNode(true)
    clone.addEventListener('click', () => button.click())
    mobileTheme.append(clone)
  })
  document.querySelectorAll('.language-switcher button').forEach((button) => {
    const clone = button.cloneNode(true)
    clone.addEventListener('click', () => button.click())
    mobileLanguage.append(clone)
  })
  const syncMobileTheme = () => mobileTheme.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === document.documentElement.dataset.theme)))
  const syncMobileLanguage = () => mobileLanguage.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.languageChoice === document.documentElement.lang)))
  syncMobileTheme()
  syncMobileLanguage()
  window.addEventListener('theme:changed', syncMobileTheme)
  window.addEventListener('language:changed', syncMobileLanguage)
  document.body.append(menu)
  const mobileBrand = menu.querySelector('.mobile-menu__top span')
  if (mobileBrand) mobileBrand.textContent = 'MONTEIRO / MENU'

  const closeButton = menu.querySelector('.mobile-menu__close')
  const backdrop = menu.querySelector('.mobile-menu__backdrop')
  closeMenu = () => {
    menu.classList.remove('is-open')
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-label', 'Ouvrir le menu')
    document.body.classList.remove('is-menu-open')
  }
  const openMenu = () => {
    menu.classList.add('is-open')
    toggle.setAttribute('aria-expanded', 'true')
    toggle.setAttribute('aria-label', 'Fermer le menu')
    document.body.classList.add('is-menu-open')
  }
  toggle.addEventListener('click', () => menu.classList.contains('is-open') ? closeMenu() : openMenu())
  closeButton.addEventListener('click', closeMenu)
  backdrop.addEventListener('click', closeMenu)
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu() })
  window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeMenu() })
}

function initLanguageScene() {
  const canvas = document.querySelector('#language-canvas')
  const layer = document.querySelector('.language-scene')
  if (!canvas || !layer) return

  const data = {
    python: { label: 'Py', color: 0x3776ab, accent: 0xffd343, lightAccent: 0x245b86, text: '#ffffff' },
    sql: { label: 'SQL', color: 0xe87525, accent: 0xffc38a, lightAccent: 0xb84f12, text: '#ffffff' },
    r: { label: 'R', color: 0x276dc3, accent: 0x9fc8ff, lightAccent: 0x1c5aa8, text: '#ffffff' },
    javascript: { label: 'JS', color: 0xf0db4f, accent: 0xfff6a2, lightAccent: 0x9b7600, text: '#171717' },
    typescript: { label: 'TS', color: 0x3178c6, accent: 0x9cc9ff, lightAccent: 0x1f5c9e, text: '#ffffff' },
    bash: { label: '>_', color: 0x202426, accent: 0x88d498, lightAccent: 0x1d7654, text: '#88d498' },
    cpp: { label: 'C++', color: 0x659ad2, accent: 0xd5e7ff, lightAccent: 0x2f6ca8, text: '#ffffff' },
    julia: { label: 'Jl', color: 0x9558b2, accent: 0xe5baff, lightAccent: 0x70428e, text: '#ffffff' },
  }
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100)
  camera.position.set(0, 0, 5.2)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const light = new THREE.PointLight(0xffffff, 4, 10)
  light.position.set(-2, 2, 4)
  scene.add(light)
  const root = new THREE.Group()
  scene.add(root)
  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let activeKey = null
  let languageBurst = null
  let layerOpacity = 0

  const disposeRoot = () => {
    while (root.children.length) {
      const child = root.children.pop()
      child.traverse((node) => {
        node.geometry?.dispose()
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose())
        else node.material?.dispose()
      })
    }
  }

  const clearBurstParticles = () => {
    scene.children.filter((child) => child.userData?.isLanguageBurstParticle).forEach((child) => {
      scene.remove(child)
      child.geometry?.dispose()
      child.material?.dispose()
    })
  }

  const roundedShape = (width, height, radius) => {
    const x = -width / 2
    const y = -height / 2
    const shape = new THREE.Shape()
    shape.moveTo(x + radius, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    shape.lineTo(x + radius, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - radius)
    shape.lineTo(x, y + radius)
    shape.quadraticCurveTo(x, y, x + radius, y)
    return shape
  }

  const buildScene = (key) => {
    const item = data[key]
    if (!item) return
    languageBurst?.destroy()
    languageBurst = null
    clearBurstParticles()
    root.visible = true
    root.position.set(0, 0, 0)
    root.scale.setScalar(1)
    disposeRoot()
    const group = new THREE.Group()
    const badgeGeometry = new THREE.ExtrudeGeometry(roundedShape(1.55, .98, .18), { depth: .22, bevelEnabled: true, bevelSegments: 5, bevelSize: .06, bevelThickness: .06 })
    badgeGeometry.center()
    const badge = new THREE.Mesh(badgeGeometry, new THREE.MeshStandardMaterial({ color: item.color, emissive: item.color, emissiveIntensity: .38, metalness: .22, roughness: .25 }))
    badge.renderOrder = 1
    group.add(badge)

    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 640
    textureCanvas.height = 400
    const context = textureCanvas.getContext('2d')
    context.clearRect(0, 0, 640, 400)
    context.fillStyle = item.text
    context.font = '800 150px Aptos, Arial, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(item.label, 320, 200)
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const faceMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .82), faceMaterial)
    face.renderOrder = 2
    face.position.z = .17
    group.add(face)

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, .018, 10, 96), new THREE.MeshBasicMaterial({ color: item.accent, transparent: true, opacity: .8, blending: THREE.AdditiveBlending }))
    outerRing.rotation.x = .65
    group.add(outerRing)
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(.82, .012, 10, 96), new THREE.MeshBasicMaterial({ color: item.accent, transparent: true, opacity: .56, blending: THREE.AdditiveBlending }))
    innerRing.rotation.y = .8
    group.add(innerRing)

    group.scale.setScalar(.95)
    root.add(group)
    activeKey = key
    const lightTheme = document.documentElement.classList.contains('is-light-theme')
    languageBurst = createBurstController({
      scene,
      group: root,
      camera,
      canvas,
      color: lightTheme ? item.lightAccent : item.accent,
      blending: lightTheme ? THREE.NormalBlending : THREE.AdditiveBlending,
      maxParticles: 280,
      scatterMin: .24,
      scatterMax: .52,
      particleSize: .014,
      particleOpacity: lightTheme ? .96 : .68,
      isVisible: () => activeKey === key && sceneState.languageActive,
    })
  }

  const resize = () => {
    const width = canvas.clientWidth || 600
    const height = canvas.clientHeight || 400
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const render = (time = 0) => {
    const seconds = time * .001
    pointer.x += (target.x - pointer.x) * .045
    pointer.y += (target.y - pointer.y) * .045
    root.rotation.y += reduceMotion ? 0 : (.003 + pointer.x * .0012)
    root.rotation.x = pointer.y * .16
    root.rotation.z = pointer.x * .1
    root.position.x = pointer.x * .3 + Math.sin(seconds * .48) * .04
    root.position.y = Math.sin(seconds * .7) * .08 + pointer.y * .18
    const burstOffset = languageBurst?.update() ?? { x: 0, y: 0 }
    root.position.x += burstOffset.x
    root.position.y += burstOffset.y
    layerOpacity += ((activeKey ? .82 : 0) - layerOpacity) * .035
    layer.style.opacity = layerOpacity.toFixed(3)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(render)
  }
  window.addEventListener('language:selected', (event) => buildScene(event.detail.key))
  window.addEventListener('theme:changed', () => { if (activeKey) buildScene(activeKey) })
  window.addEventListener('pointermove', (event) => { target.x = (event.clientX / window.innerWidth - .5) * 2; target.y = (event.clientY / window.innerHeight - .5) * -2 })
  window.addEventListener('resize', resize)
  resize()
  render()
}

function createBurstController({
  scene,
  group,
  camera,
  canvas,
  color,
  maxParticles = 900,
  scatterMin = .5,
  scatterMax = 1.6,
  particleSize = .035,
  particleOpacity = 1,
  blending = THREE.AdditiveBlending,
  isVisible,
}) {
  const state = { active: false, offset: { x: 0, y: 0, z: 0 } }
  let particles
  let sourcePositions
  let dispersedPositions
  let startedAt = 0
  let cleanupTimer
  const originalScale = group.scale.clone()
  const scatterDuration = 700
  const reformDelay = 180
  const reformDuration = 2400
  const revealDuration = 680
  const point = new THREE.Vector3()

  const finish = () => {
    if (cleanupTimer) window.clearTimeout(cleanupTimer)
    cleanupTimer = undefined
    state.active = false
    group.visible = true
    group.scale.copy(originalScale)
    if (particles) {
      scene.remove(particles)
      particles.geometry.dispose()
      particles.material.dispose()
      particles = undefined
    }
    state.offset = { x: state.destination?.x || 0, y: state.destination?.y || 0, z: 0 }
  }

  const trigger = () => {
    if (state.active || !isVisible()) return
    group.updateMatrixWorld(true)
    const positions = []
    group.traverse((child) => {
      if (!child.isMesh || !child.geometry?.attributes?.position) return
      const attribute = child.geometry.attributes.position
      for (let index = 0; index < attribute.count; index += 1) {
        point.fromBufferAttribute(attribute, index).applyMatrix4(child.matrixWorld)
        positions.push(point.x, point.y, point.z)
      }
    })
    if (!positions.length) return

    if (positions.length / 3 > maxParticles) {
      const stride = Math.max(3, Math.ceil((positions.length / 3) / maxParticles) * 3)
      const sampledPositions = []
      for (let index = 0; index < positions.length; index += stride) {
        sampledPositions.push(positions[index], positions[index + 1], positions[index + 2])
      }
      positions.length = 0
      positions.push(...sampledPositions)
    }

    sourcePositions = new Float32Array(positions)
    dispersedPositions = new Float32Array(positions.length)
    const direction = Math.random() * Math.PI * 2
    const distance = 1.1 + Math.random() * .45
    state.destination = { x: Math.cos(direction) * distance, y: Math.sin(direction) * .7, z: 0 }
    for (let index = 0; index < positions.length; index += 3) {
      const spread = scatterMin + Math.random() * Math.max(0, scatterMax - scatterMin)
      dispersedPositions[index] = positions[index] + (Math.random() - .5) * spread
      dispersedPositions[index + 1] = positions[index + 1] + (Math.random() - .5) * spread
      dispersedPositions[index + 2] = positions[index + 2] + (Math.random() - .5) * spread
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(sourcePositions.slice(), 3))
    const material = new THREE.PointsMaterial({ color, size: particleSize, transparent: true, opacity: particleOpacity, blending, depthWrite: false })
    particles = new THREE.Points(geometry, material)
    particles.userData.isLanguageBurstParticle = true
    scene.add(particles)
    group.visible = false
    state.active = true
    startedAt = performance.now()
    cleanupTimer = window.setTimeout(finish, scatterDuration + reformDelay + reformDuration + 120)
  }

  const update = () => {
    if (!state.active || !particles) return state.offset
    const elapsed = performance.now() - startedAt
    const attribute = particles.geometry.attributes.position
    const reformProgress = Math.max(0, Math.min(1, (elapsed - scatterDuration - reformDelay) / reformDuration))
    const scatterProgress = Math.max(0, Math.min(1, elapsed / scatterDuration))
    const easedScatter = scatterProgress * scatterProgress * (3 - 2 * scatterProgress)
    const easedReform = reformProgress * reformProgress * (3 - 2 * reformProgress)
    const revealProgress = Math.max(0, Math.min(1, (elapsed - (scatterDuration + reformDelay + reformDuration - revealDuration)) / revealDuration))
    const easedReveal = revealProgress * revealProgress * (3 - 2 * revealProgress)
    const offsetX = reformProgress * state.destination.x
    const offsetY = reformProgress * state.destination.y
    state.offset.x = offsetX
    state.offset.y = offsetY
    for (let index = 0; index < attribute.count; index += 1) {
      const base = index * 3
      if (elapsed < scatterDuration) {
        attribute.array[base] = sourcePositions[base] + (dispersedPositions[base] - sourcePositions[base]) * easedScatter
        attribute.array[base + 1] = sourcePositions[base + 1] + (dispersedPositions[base + 1] - sourcePositions[base + 1]) * easedScatter
        attribute.array[base + 2] = sourcePositions[base + 2] + (dispersedPositions[base + 2] - sourcePositions[base + 2]) * easedScatter
      } else {
        attribute.array[base] = dispersedPositions[base] + (sourcePositions[base] + offsetX - dispersedPositions[base]) * easedReform
        attribute.array[base + 1] = dispersedPositions[base + 1] + (sourcePositions[base + 1] + offsetY - dispersedPositions[base + 1]) * easedReform
        attribute.array[base + 2] = dispersedPositions[base + 2] + (sourcePositions[base + 2] - dispersedPositions[base + 2]) * easedReform
      }
    }
    attribute.needsUpdate = true
    if (revealProgress > 0) {
      group.visible = true
      group.scale.copy(originalScale).multiplyScalar(.08 + easedReveal * .92)
    }
    particles.material.opacity = revealProgress > 0
      ? Math.max(0, particleOpacity * (1 - easedReveal))
      : elapsed < scatterDuration ? particleOpacity - easedScatter * particleOpacity * .4 : particleOpacity * (.58 + easedReform * .42)
    if (elapsed >= scatterDuration + reformDelay + reformDuration) {
      finish()
    }
    return state.offset
  }

  const destroy = () => {
    finish()
    state.offset = { x: 0, y: 0, z: 0 }
  }

  window.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !isVisible()) return
    const bounds = canvas.getBoundingClientRect()
    const projected = group.position.clone().project(camera)
    const x = bounds.left + (projected.x + 1) * .5 * bounds.width
    const y = bounds.top + (1 - projected.y) * .5 * bounds.height
    const radius = Math.max(54, Math.min(bounds.width, bounds.height) * .1)
    if (Math.hypot(event.clientX - x, event.clientY - y) > radius) return
    event.preventDefault()
    event.stopPropagation()
    trigger()
  }, true)

  return { update, destroy }
}
resetSceneInactivity()

function initHeroScene() {
  const canvas = document.querySelector('#hero-canvas')
  if (!canvas) return

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100)
  camera.position.set(0, 0, 8)
  const signal = new THREE.Group()
  signal.position.set(1.35, .1, 0)
  scene.add(signal)

  const rings = [
    { radius: 2.05, tube: .018, color: 0xff641c, opacity: .5, rotation: [.15, .3, -.35] },
    { radius: 1.62, tube: .025, color: 0xff8b42, opacity: .75, rotation: [1.1, -.2, .2] },
    { radius: 1.08, tube: .035, color: 0xffb375, opacity: .92, rotation: [.3, 1.1, .4] },
  ]
  const ringMaterials = []
  const ringMaterial = (color, opacity) => {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    ringMaterials.push({ material, base: opacity })
    return material
  }
  rings.forEach(({ radius, tube, color, opacity, rotation }) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 160), ringMaterial(color, opacity))
    ring.rotation.set(...rotation)
    signal.add(ring)
  })

  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x35150a, wireframe: true, transparent: true, opacity: .8 })
  signal.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.78, 2), coreMaterial))

  const positions = []
  rings.forEach(({ radius, tube, rotation }, ringIndex) => {
    const euler = new THREE.Euler(...rotation)
    for (let index = 0; index < 720; index += 1) {
      const u = Math.random() * Math.PI * 2
      const v = Math.random() * Math.PI * 2
      const point = new THREE.Vector3((radius + tube * 7 * Math.cos(v)) * Math.cos(u), (radius + tube * 7 * Math.cos(v)) * Math.sin(u), tube * 7 * Math.sin(v)).applyEuler(euler)
      positions.push(point.x, point.y, point.z)
    }
  })
  const particles = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: 0xff8b42, size: .018, transparent: true, opacity: .7, blending: THREE.AdditiveBlending }))
  signal.add(particles)

  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 256
  const glowContext = glowCanvas.getContext('2d')
  const glow = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128)
  glow.addColorStop(0, 'rgba(255, 112, 43, .95)')
  glow.addColorStop(.24, 'rgba(255, 90, 22, .5)')
  glow.addColorStop(1, 'rgba(255, 70, 10, 0)')
  glowContext.fillStyle = glow
  glowContext.fillRect(0, 0, 256, 256)
  const glowMaterial = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, opacity: .55, blending: THREE.AdditiveBlending })
  const glowSprite = new THREE.Sprite(glowMaterial)
  glowSprite.scale.set(3.3, 3.3, 1)
  signal.add(glowSprite)
  const burst = createBurstController({
    scene,
    group: signal,
    camera,
    canvas,
    color: 0xffb375,
    maxParticles: 520,
    scatterMin: .32,
    scatterMax: .95,
    particleSize: .018,
    particleOpacity: .78,
    isVisible: () => sceneState.homeActive || sceneState.idle,
  })

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth
    const height = canvas.clientHeight || canvas.parentElement.clientHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const render = () => {
    pointer.x += (target.x - pointer.x) * .035
    pointer.y += (target.y - pointer.y) * .035
    signal.rotation.y += reduceMotion ? 0 : (.0018 + pointer.x * .0007)
    signal.rotation.x = pointer.y * .14
    signal.rotation.z = pointer.x * .12
    signal.position.x = 1.35 + pointer.x * .08
    signal.position.y = .1 + pointer.y * .08
    const burstOffset = burst.update()
    signal.position.x += burstOffset.x
    signal.position.y += burstOffset.y
    particles.rotation.y -= .0012
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(render)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', (event) => { target.x = (event.clientX / window.innerWidth - .5) * 2; target.y = (event.clientY / window.innerHeight - .5) * -2 })
  resize()
  render()
}

function initGeminiScene() {
  const canvas = document.querySelector('#gemini-canvas-page')
  if (!canvas) return
  const layer = canvas.parentElement

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100)
  camera.position.set(0, 0, 5.5)
  const group = new THREE.Group()
  scene.add(group)

  const shape = new THREE.Shape()
  shape.moveTo(0, 1.32)
  shape.bezierCurveTo(.09, .72, .53, .18, 1.32, 0)
  shape.bezierCurveTo(.53, -.18, .09, -.72, 0, -1.32)
  shape.bezierCurveTo(-.09, -.72, -.53, -.18, -1.32, 0)
  shape.bezierCurveTo(-.53, .18, -.09, .72, 0, 1.32)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .3, bevelEnabled: true, bevelSegments: 5, bevelSize: .12, bevelThickness: .1, curveSegments: 8 })
  geometry.center()
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vPosition; varying vec3 vNormal; void main(){ vPosition=position; vNormal=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec3 vPosition; varying vec3 vNormal; void main(){ vec2 p=normalize(vPosition.xy+vec2(.001)); float top=max(p.y,0.0); float right=max(p.x,0.0); float left=max(-p.x,0.0); float bottom=max(-p.y,0.0); vec3 red=vec3(1.0,.08,.12); vec3 blue=vec3(.04,.42,1.0); vec3 yellow=vec3(1.0,.82,.0); vec3 green=vec3(.0,.78,.46); vec3 color=(red*top + blue*right + yellow*left + green*bottom)/max(top+right+left+bottom,.001); float light=.95+dot(normalize(vNormal),normalize(vec3(-.25,.55,1.0)))*.2; gl_FragColor=vec4(color*light*1.55,1.0); }`,
    side: THREE.DoubleSide,
  })
  const icon = new THREE.Mesh(geometry, material)
  icon.rotation.set(.35, -.2, .18)
  icon.scale.setScalar(.46)
  group.add(icon)

  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 256
  const glowContext = glowCanvas.getContext('2d')
  const glowGradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128)
  glowGradient.addColorStop(0, 'rgba(118, 106, 255, .42)')
  glowGradient.addColorStop(.4, 'rgba(66, 126, 255, .2)')
  glowGradient.addColorStop(1, 'rgba(24, 44, 180, 0)')
  glowContext.fillStyle = glowGradient
  glowContext.fillRect(0, 0, 256, 256)
  const glowMaterial = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, opacity: .62, blending: THREE.AdditiveBlending, depthWrite: false })
  const glowSprite = new THREE.Sprite(glowMaterial)
  glowSprite.scale.set(1.35, 1.35, 1)
  glowSprite.position.z = -.35
  const burst = createBurstController({ scene, group, camera, canvas, color: 0x9bc8ff, isVisible: () => sceneState.aboutActive || sceneState.idle })

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let sceneOffsetX = 0
  let sceneOffsetY = 0
  let layerOpacity = 0
  const resize = () => {
    const width = canvas.clientWidth || 190
    const height = canvas.clientHeight || 190
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const render = (time = 0) => {
    const seconds = time * .001
    pointer.x += (target.x - pointer.x) * .075
    pointer.y += (target.y - pointer.y) * .075
    group.rotation.y += reduceMotion ? 0 : (.0018 + pointer.x * .0012)
    group.rotation.x = pointer.y * .22 + Math.sin(seconds * .45) * .025
    group.rotation.z = pointer.x * .18
    const anchoredAbout = sceneState.aboutActive && !sceneState.idle
    const targetOffsetX = anchoredAbout ? -1.55 : 0
    sceneOffsetX += (targetOffsetX - sceneOffsetX) * .025
    const targetOffsetY = anchoredAbout ? .05 : 0
    sceneOffsetY += (targetOffsetY - sceneOffsetY) * .025
    const idleFloatX = Math.sin(seconds * .48) * (anchoredAbout ? .015 : .06)
    const idleFloatY = Math.cos(seconds * .62) * (anchoredAbout ? .015 : .06)
    const mouseInfluenceX = anchoredAbout ? 0 : pointer.x * .52
    const mouseInfluenceY = anchoredAbout ? 0 : pointer.y * .34
    group.position.x = idleFloatX + sceneOffsetX + mouseInfluenceX
    group.position.y = idleFloatY + sceneOffsetY + mouseInfluenceY
    const burstOffset = burst.update()
    group.position.x += burstOffset.x
    group.position.y += burstOffset.y
    group.position.z = Math.sin(seconds * .3) * .22
    icon.position.y = Math.sin(seconds * 1.2) * .06
    material.uniforms.uTime.value = seconds
    glowMaterial.opacity = .82 + Math.sin(seconds * 1.5) * .1
    const targetOpacity = sceneState.aboutActive || (sceneState.idle && !sceneState.languageActive) ? .72 * sceneOpacityFactor() : 0
    layerOpacity += (targetOpacity - layerOpacity) * .09
    layer.style.opacity = layerOpacity.toFixed(3)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(render)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', (event) => { target.x = (event.clientX / window.innerWidth - .5) * 2; target.y = (event.clientY / window.innerHeight - .5) * -2 })
  resize()
  render()
}

function initChatGPTScene() {
  const canvas = document.querySelector('#chatgpt-canvas-page')
  if (!canvas) return
  const layer = canvas.parentElement

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100)
  camera.position.set(0, 0, 5.5)
  const group = new THREE.Group()
  group.scale.setScalar(.62)
  group.position.set(-1.65, -.25, -.2)
  scene.add(group)
  scene.add(new THREE.AmbientLight(0xffffff, 1.35))
  const keyLight = new THREE.PointLight(0xb8ffe8, 2.5, 12)
  keyLight.position.set(-2, 2, 4)
  scene.add(keyLight)

  const colors = [0xffffff, 0xf1fff9, 0xdaf5e9]
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3
    const points = []
    for (let pointIndex = 0; pointIndex <= 30; pointIndex += 1) {
      const t = -.78 * Math.PI + (1.56 * Math.PI * pointIndex) / 30
      const point = new THREE.Vector3(.22 + Math.cos(t) * .43, Math.sin(t) * .43, Math.sin(t * 2) * .045)
      point.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle)
      points.push(point)
    }
    const loop = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, .082, 12, false),
      new THREE.MeshStandardMaterial({ color: colors[index % colors.length], emissive: 0x397b66, emissiveIntensity: .28, metalness: .15, roughness: .24, transparent: true, opacity: .96 })
    )
    loop.rotation.set(Math.sin(angle) * .12, Math.cos(angle) * .12, 0)
    group.add(loop)
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 }))
  group.add(core)

  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 256
  const glowContext = glowCanvas.getContext('2d')
  const glowGradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128)
  glowGradient.addColorStop(0, 'rgba(137, 255, 211, .34)')
  glowGradient.addColorStop(.42, 'rgba(74, 230, 183, .16)')
  glowGradient.addColorStop(1, 'rgba(20, 90, 72, 0)')
  glowContext.fillStyle = glowGradient
  glowContext.fillRect(0, 0, 256, 256)
  const glowMaterial = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false })
  const glowSprite = new THREE.Sprite(glowMaterial)
  glowSprite.scale.set(1.35, 1.35, 1)
  glowSprite.position.z = -.4
  group.add(glowSprite)
  const burst = createBurstController({ scene, group, camera, canvas, color: 0xbafbe5, isVisible: () => (sceneState.servicesActive || sceneState.idle) && !sceneState.languageActive })

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let sceneY = -.25
  let idleLift = 0
  let sceneX = -1.65
  let layerOpacity = 0
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const render = (time = 0) => {
    const seconds = time * .001
    pointer.x += (target.x - pointer.x) * .04
    pointer.y += (target.y - pointer.y) * .04
    group.rotation.y -= reduceMotion ? 0 : (.003 + pointer.x * .0007)
    group.rotation.x = pointer.y * .13
    group.rotation.z = pointer.x * .08
    const anchoredServices = sceneState.servicesActive && !sceneState.idle
    const targetX = anchoredServices ? -1.45 : sceneState.idle ? 1.35 : -1.65
    sceneX += (targetX - sceneX) * .045
    const targetY = anchoredServices ? .1 : sceneState.idle ? 0 : -.25
    sceneY += (targetY - sceneY) * .035
    const targetLift = anchoredServices || sceneState.idle ? 0 : .85
    idleLift += (targetLift - idleLift) * .006
    const mouseInfluenceX = anchoredServices ? 0 : pointer.x * .16
    const mouseInfluenceY = anchoredServices ? 0 : pointer.y * .12
    group.position.x = sceneX + (anchoredServices ? 0 : Math.sin(seconds * .38) * .12) + mouseInfluenceX
    group.position.y = sceneY + idleLift + (anchoredServices ? 0 : Math.cos(seconds * .52) * .1) + mouseInfluenceY
    const burstOffset = burst.update()
    group.position.x += burstOffset.x
    group.position.y += burstOffset.y
    glowMaterial.opacity = .46 + Math.sin(seconds * 1.2) * .05
    const targetOpacity = sceneState.servicesActive || (sceneState.idle && !sceneState.languageActive) ? .82 * sceneOpacityFactor() : 0
    layerOpacity += (targetOpacity - layerOpacity) * .09
    layer.style.opacity = layerOpacity.toFixed(3)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(render)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', (event) => { target.x = (event.clientX / window.innerWidth - .5) * 2; target.y = (event.clientY / window.innerHeight - .5) * -2 })
  resize()
  render()
}

function initClaudeScene() {
  const canvas = document.querySelector('#claude-canvas-page')
  if (!canvas) return
  const layer = canvas.parentElement

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100)
  camera.position.set(0, 0, 5.5)
  scene.add(new THREE.AmbientLight(0xfff1e6, 2.2))
  const keyLight = new THREE.PointLight(0xff9a72, 5, 12)
  keyLight.position.set(2, 2, 4)
  scene.add(keyLight)

  const group = new THREE.Group()
  group.position.set(1.5, -.1, -.15)
  group.scale.setScalar(.78)
  scene.add(group)

  const material = new THREE.MeshStandardMaterial({ color: 0xd9775e, emissive: 0x8f2e1d, emissiveIntensity: .95, metalness: .12, roughness: .3 })
  for (let index = 0; index < 12; index += 1) {
    const ray = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .58, 14), material)
    shaft.position.y = .34
    ray.add(shaft)
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.068, 14, 10), material)
    cap.position.y = .66
    ray.add(cap)
    ray.rotation.z = index * Math.PI / 6
    group.add(ray)
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 24), new THREE.MeshStandardMaterial({ color: 0xf08f72, emissive: 0xb7462c, emissiveIntensity: 1, roughness: .25 }))
  group.add(center)

  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 256
  const glowContext = glowCanvas.getContext('2d')
  const glowGradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128)
  glowGradient.addColorStop(0, 'rgba(255, 134, 100, .62)')
  glowGradient.addColorStop(.42, 'rgba(210, 78, 48, .28)')
  glowGradient.addColorStop(1, 'rgba(120, 35, 20, 0)')
  glowContext.fillStyle = glowGradient
  glowContext.fillRect(0, 0, 256, 256)
  const glowMaterial = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })
  const glowSprite = new THREE.Sprite(glowMaterial)
  glowSprite.scale.set(2, 2, 1)
  glowSprite.position.z = -.4
  const burst = createBurstController({ scene, group, camera, canvas, color: 0xff9b78, isVisible: () => (sceneState.featureActive || sceneState.idle) && !sceneState.languageActive })

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let sceneX = 1.5
  let sceneY = -.1
  let layerOpacity = 0
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const render = (time = 0) => {
    const seconds = time * .001
    pointer.x += (target.x - pointer.x) * .04
    pointer.y += (target.y - pointer.y) * .04
    group.rotation.y += reduceMotion ? 0 : .0025
    group.rotation.x = pointer.y * .14
    group.rotation.z = pointer.x * .12
    const anchoredFeature = sceneState.featureActive && !sceneState.idle
    const targetX = anchoredFeature ? -1.5 : sceneState.idle ? -1.35 : 1.5
    const targetY = anchoredFeature ? .1 : 0
    sceneX += (targetX - sceneX) * .045
    sceneY += (targetY - sceneY) * .035
    group.position.x = sceneX + (anchoredFeature ? 0 : Math.sin(seconds * .36) * .08) + pointer.x * (anchoredFeature ? 0 : .16)
    group.position.y = sceneY + (anchoredFeature ? 0 : Math.cos(seconds * .5) * .08) + pointer.y * (anchoredFeature ? 0 : .12)
    const burstOffset = burst.update()
    group.position.x += burstOffset.x
    group.position.y += burstOffset.y
    glowMaterial.opacity = .78 + Math.sin(seconds * 1.3) * .1
    const targetOpacity = sceneState.featureActive || (sceneState.idle && !sceneState.languageActive) ? .78 * sceneOpacityFactor() : 0
    layerOpacity += (targetOpacity - layerOpacity) * .09
    layer.style.opacity = layerOpacity.toFixed(3)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(render)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', (event) => { target.x = (event.clientX / window.innerWidth - .5) * 2; target.y = (event.clientY / window.innerHeight - .5) * -2 })
  resize()
  render()
}

const start = () => {
  if (!gsap || reduceMotion) { preloader?.remove(); document.body.classList.add('is-ready'); return }
  gsap.registerPlugin(ScrollTrigger)
  gsap.timeline({ defaults: { ease: 'power4.out' } }).to('.preloader__line i', { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }).to('.preloader__brand', { y: -18, opacity: 0, duration: .45 }, '-=.15').to('.preloader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power4.inOut' }).from('.topbar', { y: -18, opacity: 0, duration: .55 }, '-=.35').from('.hero__content > *, .hero__visual', { y: 24, opacity: 0, duration: .75, stagger: .08 }, '-=.25').add(() => { preloader?.remove(); document.body.classList.add('is-ready') })
  gsap.utils.toArray('.reveal').forEach((element) => gsap.from(element, { y: 24, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } }))
  gsap.to('.hero__visual', { y: 38, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
  gsap.to('.contact__orb', { y: -20, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  gsap.utils.toArray('section[id]').forEach((section) => ScrollTrigger.create({ trigger: section, start: 'top 45%', end: 'bottom 45%', onToggle: ({ isActive }) => { if (!isActive) return; document.querySelectorAll('.nav__link').forEach((item) => item.classList.remove('is-active')); document.querySelector(`.nav__link[href="#${section.id}"]`)?.classList.add('is-active') } }))
}

window.addEventListener('load', start, { once: true })
initThemeSwitcher()
replaceFeatureCards()
initContactForm()
initLanguageSwitcher()
initMobileMenu()
initHeroScene()
initGeminiScene()
initChatGPTScene()
initClaudeScene()
initGrokScene()
initServicesCarousel()
initLanguageScene()
initLanguageInteractions()
document.querySelectorAll('.nav__link').forEach((link) => link.addEventListener('click', () => { document.querySelectorAll('.nav__link').forEach((item) => item.classList.remove('is-active')); link.classList.add('is-active') }))
if (window.matchMedia('(pointer: fine)').matches && !reduceMotion && gsap) document.querySelectorAll('.magnetic').forEach((element) => { element.addEventListener('mousemove', (event) => { const bounds = element.getBoundingClientRect(); gsap.to(element, { x: (event.clientX - bounds.left - bounds.width / 2) * .12, y: (event.clientY - bounds.top - bounds.height / 2) * .12, duration: .3, ease: 'power3.out' }) }); element.addEventListener('mouseleave', () => gsap.to(element, { x: 0, y: 0, duration: .45, ease: 'elastic.out(1,.35)' })) })
