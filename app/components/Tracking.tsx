import { Partytown } from '@builder.io/partytown/react'
import { useEffect } from 'react'
import { useLocation } from '@remix-run/react'
import config from '~/config'

export default function Tracking() {
  const location = useLocation()

  useEffect(() => {
    // @ts-ignore
    window.gtag('event', 'page_view', {
      page_location: location.pathname + location.search,
    })
  }, [location])

  return (
    <>
      <Partytown forward={['dataLayer.push', 'window.gtag']} />
      <script
        type="text/partytown"
        async
        defer
        src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsMeasurementID}`}
      ></script>
      <script type="text/partytown">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${config.googleAnalyticsMeasurementID}');
      `}</script>
    </>
  )
}
