import React, { useEffect } from 'react'
import {
  GrowthBookProvider as ActualGrowthBookProvider,
  GrowthBook,
} from '@growthbook/growthbook-react'
import config from '~/config'

export const growthbook = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: config.growthbookClientKey,
  trackingCallback: (experiment, result) => {
    if ('gtag' in window && window.gtag) {
      window.gtag('event', 'experiment_viewed', {
        event_category: 'experiment',
        experiment_id: experiment.key,
        variation_id: result.variationId,
      })
    }
  },
})

interface Props {
  features: ReturnType<(typeof growthbook)['getFeatures']>
  attributes?: Record<string, any>
}

const GrowthBookProvider: React.FC<React.PropsWithChildren<Props>> = ({
  features,
  attributes,
  children,
}) => {
  useEffect(() => {
    growthbook.setFeatures(features)
  }, [features])

  useEffect(() => {
    if (attributes) {
      growthbook.setAttributes({
        ...growthbook.getAttributes(),
        ...attributes,
      })
    }
  }, [attributes])

  return (
    <ActualGrowthBookProvider growthbook={growthbook}>
      {children}
    </ActualGrowthBookProvider>
  )
}

export default GrowthBookProvider
