import { Partytown } from '@builder.io/partytown/react'
import { useEffect, createContext } from 'react'
import { useLocation } from '@remix-run/react'
import config from '~/config'

export default function Tracking() {
  const location = useLocation()

  useEffect(() => {
    if ('gtag' in window && window.gtag) {
      window.gtag('event', 'page_view', {
        page_location: location.pathname + location.search,
      })
    }
  }, [location])

  return (
    <>
      <Partytown forward={['gtag']} />
      <script
        type="text/partytown"
        src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsMeasurementID}`}
      />
      <script
        type="text/partytown"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() {dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${config.googleAnalyticsMeasurementID}');
          `,
        }}
      />
    </>
  )
}
