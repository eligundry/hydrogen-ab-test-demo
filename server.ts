// Virtual entry point for the app
import * as remixBuild from '@remix-run/dev/server-build'
import {
  createRequestHandler,
  getStorefrontHeaders,
} from '@shopify/remix-oxygen'
import { createStorefrontClient, storefrontRedirect } from '@shopify/hydrogen'
import { GrowthBook, setPolyfills } from '@growthbook/growthbook'
import { HydrogenSession } from '~/lib/session.server'
import { getLocaleFromRequest } from '~/lib/utils'
import config from '~/config'
import { getGoogleAnalyticsClientIdFromCookie } from '~/lib/cookies.server'

// Really lazy caching of features for GrowthBook.
// This is running in a Lambda of some sort, so this should be fine.
const cache: Record<string, any> = {}
setPolyfills({
  localStorage: {
    getItem: (key: string) => cache[key] ?? null,
    setItem: (key: string, value: string) => {
      cache[key] = value
    },
  },
})

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext
  ): Promise<Response> {
    try {
      /**
       * Open a cache instance in the worker and a custom session instance.
       */
      if (!env?.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set')
      }

      const waitUntil = (p: Promise<any>) => executionContext.waitUntil(p)
      const [cache, session] = await Promise.all([
        caches.open('hydrogen'),
        HydrogenSession.init(request, [env.SESSION_SECRET]),
      ])

      /**
       * Create Hydrogen's Storefront client.
       */
      const i18n = getLocaleFromRequest(request)
      const { storefront } = createStorefrontClient({
        cache,
        waitUntil,
        i18n,
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: `https://${env.PUBLIC_STORE_DOMAIN}`,
        storefrontApiVersion: env.PUBLIC_STOREFRONT_API_VERSION || '2023-01',
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      })

      /**
       * Create a GrowthBook instance.
       */
      const growthbook = new GrowthBook({
        apiHost: 'https://cdn.growthbook.io',
        clientKey: config.growthbookClientKey,
        attributes: {
          country: i18n.country,
          language: i18n.language,
          loggedIn: Boolean(session.get('customerAccessToken')),
          googleClientID: getGoogleAnalyticsClientIdFromCookie(
            request.headers.get('cookie') ?? ''
          ),
        },
      })

      await growthbook.loadFeatures()

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => ({
          cache,
          session,
          waitUntil,
          storefront,
          env,
          growthbook,
        }),
      })

      const response = await handleRequest(request)

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({ request, response, storefront })
      }

      // Clean up GrowthBook instance
      growthbook.destroy()

      return response
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return new Response('An unexpected error occurred', { status: 500 })
    }
  },
}
