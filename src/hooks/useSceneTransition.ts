import { useState, useCallback } from 'react';

export type SceneTransitionType = 'dip-to-color' | 'slide-wipe' | 'smooth-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash';

export interface UseSceneTransitionProps {
  defaultColor?: string;
  defaultDuration?: number;
  defaultType?: SceneTransitionType;
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
  const [transitionType, setTransitionType] = useState<SceneTransitionType>(defaultType);

  const triggerTransition = useCallback((
    onSceneChange: () => void, 
    customOptions?: { color?: string; duration?: number; type?: SceneTransitionType }
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
