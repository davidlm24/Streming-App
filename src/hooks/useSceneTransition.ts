import { useState, useCallback } from 'react';

import type { WipeTransitionType } from '../types';

// Reexportado para quem já importava daqui; a definição canônica vive em types.ts.
export type { WipeTransitionType };

export interface UseSceneTransitionProps {
  defaultColor?: string;
  defaultDuration?: number;
  defaultType?: WipeTransitionType;
}

export function useSceneTransition({
  defaultColor = '#4683E0',
  defaultDuration = 600,
  defaultType = 'dip-to-color'
}: UseSceneTransitionProps = {}) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'covering' | 'revealing'>('idle');
  const [overlayColor, setOverlayColor] = useState(defaultColor);
  const [duration, setDuration] = useState(defaultDuration);
  const [transitionType, setTransitionType] = useState<WipeTransitionType>(defaultType);

  const triggerTransition = useCallback((
    onSceneChange: () => void, 
    customOptions?: { color?: string; duration?: number; type?: WipeTransitionType }
  ) => {
    if (isTransitioning) return;

    const activeColor = customOptions?.color ?? overlayColor;
    const activeDuration = customOptions?.duration ?? duration;
    const activeType = customOptions?.type ?? transitionType;

    if (customOptions?.color) setOverlayColor(customOptions.color);
    if (customOptions?.duration) setDuration(customOptions.duration);
    if (customOptions?.type) setTransitionType(customOptions.type);

    setIsTransitioning(true);
    setTransitionStage('covering');

    // Halfway through the transition, execute the state change (when screen is fully covered by color)
    setTimeout(() => {
      onSceneChange();
      setTransitionStage('revealing');

      // Finish the transition
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionStage('idle');
      }, activeDuration / 2);

    }, activeDuration / 2);
  }, [isTransitioning, overlayColor, duration, transitionType]);

  return {
    isTransitioning,
    transitionStage,
    overlayColor,
    setOverlayColor,
    duration,
    setDuration,
    transitionType,
    setTransitionType,
    triggerTransition
  };
}
