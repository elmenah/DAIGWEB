import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { serviceBySlug } from '../data/servicePages'

const SITE_URL = 'https://www.daigchile.cl'
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpeg`

const defaultMeta = {
  title: 'Ingenieria Industrial y CNC en Chile | DAIG Chile SPA',
  description:
    'DAIG Chile SPA: ingenieria industrial en Puchuncavi. Piping, estructuras metalicas, obras civiles, modelamiento 3D, diseno mecanico y CNC para industria.',
  robots: 'index,follow',
}

const staticRoutes = {
  '/': defaultMeta,
  '/digital': {
    title: 'Automatizacion e IA para Empresas | DAIG Digital',
    description:
      'Soluciones digitales para empresas industriales: automatizacion de procesos, chatbots, agentes IA y dashboards para operar con mayor eficiencia.',
    robots: 'index,follow',
  },
  '/cotizar': {
    title: 'Cotizar Servicios Industriales | DAIG Chile - Presupuesto Gratis',
    description:
      'Solicita cotizacion de servicios industriales en Chile. Piping, estructuras metalicas, obras civiles, CNC y diseno mecanico con respuesta rapida.',
    robots: 'index,follow',
  },
  '/servicios': {
    title: 'Servicios Industriales en Puchuncavi y Quintero | DAIG Chile',
    description:
      'Explora todos los servicios de DAIG Chile: piping, estructuras metalicas, obras civiles, modelamiento 3D, proteccion de tuberias, CNC y diseno mecanico.',
    robots: 'index,follow',
  },
  '/admin': {
    title: 'Acceso Administracion | DAIG Chile',
    description: 'Portal interno de administracion.',
    robots: 'noindex,nofollow',
  },
  '/admin/dashboard': {
    title: 'Panel Administracion | DAIG Chile',
    description: 'Panel interno de administracion.',
    robots: 'noindex,nofollow',
  },
  '/tecnico': {
    title: 'Portal Tecnico | DAIG Chile',
    description: 'Portal interno tecnico.',
    robots: 'noindex,nofollow',
  },
}

const upsertMeta = (selector, attr, value) => {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, selector.includes('property=') ? selector.match(/property="([^"]+)"/)?.[1] || '' : selector.match(/name="([^"]+)"/)?.[1] || '')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

function resolveMeta(pathname) {
  if (pathname.startsWith('/servicios/')) {
    const slug = pathname.replace('/servicios/', '')
    const service = serviceBySlug[slug]
    if (service) {
      return {
        title: service.title,
        description: service.description,
        robots: 'index,follow',
      }
    }
  }
  return staticRoutes[pathname] || defaultMeta
}

function RouteSeo() {
  const location = useLocation()

  useEffect(() => {
    const meta = resolveMeta(location.pathname)
    const canonicalUrl = `${SITE_URL}${location.pathname === '/' ? '/' : location.pathname}`

    document.title = meta.title
    upsertMeta('meta[name="description"]', 'name', meta.description)
    upsertMeta('meta[name="robots"]', 'name', meta.robots)

    upsertMeta('meta[property="og:title"]', 'property', meta.title)
    upsertMeta('meta[property="og:description"]', 'property', meta.description)
    upsertMeta('meta[property="og:url"]', 'property', canonicalUrl)
    upsertMeta('meta[property="og:type"]', 'property', 'website')
    upsertMeta('meta[property="og:image"]', 'property', DEFAULT_IMAGE)

    upsertMeta('meta[name="twitter:title"]', 'name', meta.title)
    upsertMeta('meta[name="twitter:description"]', 'name', meta.description)
    upsertMeta('meta[name="twitter:image"]', 'name', DEFAULT_IMAGE)

    let canonicalTag = document.head.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }
    canonicalTag.setAttribute('href', canonicalUrl)
  }, [location.pathname])

  return null
}

export default RouteSeo