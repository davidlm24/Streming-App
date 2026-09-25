import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  uploadMediaToCloudStorage, 
  deleteMediaFromCloudStorage, 
  subscribeUserMediaAssets,
  CloudMediaAsset 
} from '../lib/storageService';

import { auth } from '../lib/firebase';

type VideoClip = {
  id: string;
  name: string;
  duration: string;
  url: string;
  thumbnail: string;
  isPlaying: boolean;
  isCustom?: boolean;
  storagePath?: string;
};

export type CustomMedia = {
  id: string;
  name: string;
  url: string; // Firebase Storage URL or base64 fallback
  storagePath?: string;
};

interface MediaManagerContextType {
  activeLogo: string;
  setActiveLogo: (url: string) => void;
  activeWatermark: string;
  setActiveWatermark: (url: string) => void;
  activeOverlay: string;
  setActiveOverlay: (url: string) => void;
  activeBackground: string;
  setActiveBackground: (url: string) => void;
  
  customLogos: CustomMedia[];
  customWatermarks: CustomMedia[];
  customOverlays: CustomMedia[];
  customBackgrounds: CustomMedia[];
  customAudios: CustomMedia[];
  
  uploadCustomLogo: (file: File) => Promise<void>;
  uploadCustomWatermark: (file: File) => Promise<void>;
  uploadCustomOverlay: (file: File) => Promise<void>;
  uploadCustomBackground: (file: File) => Promise<void>;
  uploadCustomAudio: (file: File) => Promise<void>;
  deleteCustomLogo: (id: string) => void;
  deleteCustomWatermark: (id: string) => void;
  deleteCustomOverlay: (id: string) => void;
  deleteCustomBackground: (id: string) => void;
  deleteCustomAudio: (id: string) => void;
  hiddenTemplates: string[];
  hideTemplate: (id: string) => void;

  videoClips: VideoClip[];
  activeVideoClip: VideoClip | null;
  setActiveVideoClip: React.Dispatch<React.SetStateAction<VideoClip | null>>;
  playVideoClip: (id: string) => void;
  uploadVideoClip: (file: File) => Promise<void>;
  deleteVideoClip: (id: string) => void;
  
  isCloudUploading: boolean;
  cloudSyncStatus: 'synced' | 'uploading' | 'idle';
  mediaUploadError: string | null;
  setMediaUploadError: (error: string | null) => void;
}

const MediaManagerContext = createContext<MediaManagerContextType | undefined>(undefined);

export function MediaManagerProvider({ children }: { children: ReactNode }) {
  const getSaved = <T,>(key: string, initialValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [activeLogo, setActiveLogo] = useState<string>(
    getSaved('pwstreamer_activeLogo', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&auto=format&fit=crop&q=80')
  );
  const [activeWatermark, setActiveWatermark] = useState<string>(
    getSaved('pwstreamer_activeWatermark', '')
  );
  const [activeOverlay, setActiveOverlay] = useState<string>(
    getSaved('pwstreamer_activeOverlay', '')
  );
  const [activeBackground, setActiveBackground] = useState<string>(
    getSaved('pwstreamer_activeBackground', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80')
  );

  const [customLogos, setCustomLogos] = useState<CustomMedia[]>(
    getSaved('pwstreamer_customLogos', [])
  );
  const [customWatermarks, setCustomWatermarks] = useState<CustomMedia[]>(
    getSaved('pwstreamer_customWatermarks', [])
  );
  const [customOverlays, setCustomOverlays] = useState<CustomMedia[]>(
    getSaved('pwstreamer_customOverlays', [])
  );
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomMedia[]>(
    getSaved('pwstreamer_customBackgrounds', [])
  );
  const [customAudios, setCustomAudios] = useState<CustomMedia[]>(
    getSaved('pwstreamer_customAudios', [])
  );
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);

  const [videoClips, setVideoClips] = useState<VideoClip[]>(() => {
    const saved = getSaved<VideoClip[]>('pwstreamer_videoClips', []);
    return saved.filter(c => c.url && !c.url.startsWith('blob:'));
  });
  const [activeVideoClip, setActiveVideoClip] = useState<VideoClip | null>(() => {
    const saved = getSaved<VideoClip | null>('pwstreamer_activeVideoClip', null);
    if (saved && saved.url && !saved.url.startsWith('blob:')) {
      return saved;
    }
    return null;
  });

  const [isCloudUploading, setIsCloudUploading] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'uploading' | 'idle'>('synced');

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to save to localStorage (${key}):`, error);
    }
  };

  useEffect(() => {
    if (activeVideoClip) {
      safeSetItem('pwstreamer_activeVideoClip', JSON.stringify(activeVideoClip));
    } else {
      localStorage.removeItem('pwstreamer_activeVideoClip');
    }
  }, [activeVideoClip]);

  useEffect(() => {
    safeSetItem('pwstreamer_activeLogo', JSON.stringify(activeLogo));
  }, [activeLogo]);

  useEffect(() => {
    safeSetItem('pwstreamer_activeWatermark', JSON.stringify(activeWatermark));
  }, [activeWatermark]);

  useEffect(() => {
    safeSetItem('pwstreamer_activeOverlay', JSON.stringify(activeOverlay));
  }, [activeOverlay]);

  useEffect(() => {
    safeSetItem('pwstreamer_activeBackground', JSON.stringify(activeBackground));
  }, [activeBackground]);

  useEffect(() => {
    safeSetItem('pwstreamer_customLogos', JSON.stringify(customLogos));
  }, [customLogos]);

  useEffect(() => {
    safeSetItem('pwstreamer_customWatermarks', JSON.stringify(customWatermarks));
  }, [customWatermarks]);

  useEffect(() => {
    safeSetItem('pwstreamer_customOverlays', JSON.stringify(customOverlays));
  }, [customOverlays]);

  useEffect(() => {
    safeSetItem('pwstreamer_customBackgrounds', JSON.stringify(customBackgrounds));
  }, [customBackgrounds]);

  useEffect(() => {
    safeSetItem('pwstreamer_customAudios', JSON.stringify(customAudios));
  }, [customAudios]);

  useEffect(() => {
    safeSetItem('pwstreamer_videoClips', JSON.stringify(videoClips));
  }, [videoClips]);

  // Subscribe to Cloud Firestore Media Assets on user login
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeUserMediaAssets((cloudAssets) => {
      if (!cloudAssets) return;

      const cloudLogos: CustomMedia[] = [];
      const cloudWatermarks: CustomMedia[] = [];
      const cloudOverlays: CustomMedia[] = [];
      const cloudBgs: CustomMedia[] = [];
      const cloudAudios: CustomMedia[] = [];
      const cloudVideos: VideoClip[] = [];

      cloudAssets.forEach(asset => {
        const item: CustomMedia = {
          id: asset.id,
          name: asset.name,
          url: asset.url,
          storagePath: asset.storagePath
        };
        if (asset.type === "logo") cloudLogos.push(item);
        if (asset.type === "watermark") cloudWatermarks.push(item);
        if (asset.type === "overlay") cloudOverlays.push(item);
        if (asset.type === "background") cloudBgs.push(item);
        if (asset.type === "audio") cloudAudios.push(item);
        if (asset.type === "video") {
          cloudVideos.push({
            id: asset.id,
            name: asset.name.replace(/\.[^/.]+$/, ""),
            duration: 'Vídeo na Nuvem',
            url: asset.url,
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
            isPlaying: false,
            isCustom: true,
            storagePath: asset.storagePath
          });
        }
      });

      setCustomLogos(prev => {
        const merged = [...cloudLogos];
        prev.forEach(p => { 
          if (!merged.find(m => m.id === p.id || (m.storagePath && m.storagePath === p.storagePath) || m.name === p.name || m.url === p.url)) {
            merged.push(p); 
          }
        });
        return merged;
      });
      setCustomWatermarks(prev => {
        const merged = [...cloudWatermarks];
        prev.forEach(p => { 
          if (!merged.find(m => m.id === p.id || (m.storagePath && m.storagePath === p.storagePath) || m.name === p.name || m.url === p.url)) {
            merged.push(p); 
          }
        });
        return merged;
      });
      setCustomOverlays(prev => {
        const merged = [...cloudOverlays];
        prev.forEach(p => { 
          if (!merged.find(m => m.id === p.id || (m.storagePath && m.storagePath === p.storagePath) || m.name === p.name || m.url === p.url)) {
            merged.push(p); 
          }
        });
        return merged;
      });
      setCustomBackgrounds(prev => {
        const merged = [...cloudBgs];
        prev.forEach(p => { 
          if (!merged.find(m => m.id === p.id || (m.storagePath && m.storagePath === p.storagePath) || m.name === p.name || m.url === p.url)) {
            merged.push(p); 
          }
        });
        return merged;
      });
      setCustomAudios(prev => {
        const merged = [...cloudAudios];
        prev.forEach(p => { 
          if (!merged.find(m => m.id === p.id || (m.storagePath && m.storagePath === p.storagePath) || m.name === p.name || m.url === p.url)) {
            merged.push(p); 
          }
        });
        return merged;
      });
      setVideoClips(prev => {
        const merged: VideoClip[] = cloudVideos.map(cv => {
          const prevMatch = prev.find(p => 
            p.id === cv.id || 
            (p.storagePath && p.storagePath === cv.storagePath) || 
            p.name.trim().toLowerCase() === cv.name.trim().toLowerCase() || 
            p.url === cv.url
          );
          if (prevMatch && prevMatch.isPlaying) {
            return { ...cv, isPlaying: true };
          }
          return cv;
        });

        prev.forEach(p => {
          if (p.url && p.url.startsWith('blob:')) return;
          const alreadyExists = merged.some(m => 
            m.id === p.id || 
            (m.storagePath && m.storagePath === p.storagePath) || 
            m.name.trim().toLowerCase() === p.name.trim().toLowerCase() || 
            m.url === p.url
          );
          if (!alreadyExists) {
            merged.push(p);
          }
        });
        return merged;
      });

      // Update activeVideoClip URL if matching cloud video was updated
      setActiveVideoClip(current => {
        if (!current) return null;
        const match = cloudVideos.find(cv => 
          cv.id === current.id || 
          (cv.storagePath && cv.storagePath === current.storagePath) || 
          cv.name.trim().toLowerCase() === current.name.trim().toLowerCase() || 
          cv.url === current.url
        );
        if (match) {
          return { ...match, isPlaying: true };
        }
        if (current.url && current.url.startsWith('blob:')) {
          return null;
        }
        return current;
      });
      setCloudSyncStatus("synced");
    });

    return () => unsubscribe();
  }, []);

  const uploadCustomLogo = async (file: File) => {
    setIsCloudUploading(true);
    setCloudSyncStatus("uploading");
    setMediaUploadError(null);
    try {
      let assetUrl = '';
      let storagePath: string | undefined;
      let assetId = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const uploadedAsset = await uploadMediaToCloudStorage(file, 'logo');
        assetUrl = uploadedAsset.url;
        storagePath = uploadedAsset.storagePath;
        assetId = uploadedAsset.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        assetUrl = URL.createObjectURL(file);
      }

      const newMedia: CustomMedia = { 
        id: assetId, 
        name: file.name.replace(/\.[^/.]+$/, ""), 
        url: assetUrl,
        storagePath
      };
      setCustomLogos(prev => [...prev.filter(m => m.id !== newMedia.id), newMedia]);
      setActiveLogo(assetUrl);
      setCloudSyncStatus('synced');
    } catch (err: any) {
      console.error('Logo Upload failed:', err);
      setMediaUploadError(err.message || 'Erro ao fazer upload do logo.');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const uploadCustomWatermark = async (file: File) => {
    setIsCloudUploading(true);
    setCloudSyncStatus('uploading');
    setMediaUploadError(null);
    try {
      let assetUrl = '';
      let storagePath: string | undefined;
      let assetId = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const uploadedAsset = await uploadMediaToCloudStorage(file, 'watermark');
        assetUrl = uploadedAsset.url;
        storagePath = uploadedAsset.storagePath;
        assetId = uploadedAsset.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        assetUrl = URL.createObjectURL(file);
      }

      const newMedia: CustomMedia = { 
        id: assetId, 
        name: file.name.replace(/\.[^/.]+$/, ""), 
        url: assetUrl,
        storagePath
      };
      setCustomWatermarks(prev => [...prev.filter(m => m.id !== newMedia.id), newMedia]);
      setActiveWatermark(assetUrl);
      setCloudSyncStatus('synced');
    } catch (err: any) {
      console.error('Watermark Upload failed:', err);
      setMediaUploadError(err.message || 'Erro ao fazer upload da marca d\'água.');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const uploadCustomOverlay = async (file: File) => {
    setIsCloudUploading(true);
    setCloudSyncStatus('uploading');
    setMediaUploadError(null);
    try {
      let assetUrl = '';
      let storagePath: string | undefined;
      let assetId = `overlay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const uploadedAsset = await uploadMediaToCloudStorage(file, 'overlay');
        assetUrl = uploadedAsset.url;
        storagePath = uploadedAsset.storagePath;
        assetId = uploadedAsset.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        assetUrl = URL.createObjectURL(file);
      }

      const newMedia: CustomMedia = { 
        id: assetId, 
        name: file.name.replace(/\.[^/.]+$/, ""), 
        url: assetUrl,
        storagePath
      };
      setCustomOverlays(prev => [...prev.filter(m => m.id !== newMedia.id), newMedia]);
      setActiveOverlay(assetUrl);
      setCloudSyncStatus('synced');
    } catch (err: any) {
      console.error('Overlay Upload failed:', err);
      setMediaUploadError(err.message || 'Erro ao fazer upload do overlay.');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const uploadCustomBackground = async (file: File) => {
    setIsCloudUploading(true);
    setCloudSyncStatus('uploading');
    setMediaUploadError(null);
    console.log('[Upload Flow] Starting uploadCustomBackground with file:', file.name, 'size:', file.size);
    try {
      let assetUrl = '';
      let storagePath: string | undefined;
      let assetId = `bg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        console.log('[Upload Flow] Calling uploadMediaToCloudStorage for background...');
        const uploadedAsset = await uploadMediaToCloudStorage(file, 'background');
        console.log('[Upload Flow] Background upload successful:', uploadedAsset);
        assetUrl = uploadedAsset.url;
        storagePath = uploadedAsset.storagePath;
        assetId = uploadedAsset.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        assetUrl = URL.createObjectURL(file);
      }

      const newMedia: CustomMedia = { 
        id: assetId, 
        name: file.name.replace(/\.[^/.]+$/, ""), 
        url: assetUrl,
        storagePath
      };
      setCustomBackgrounds(prev => [...prev.filter(m => m.id !== newMedia.id), newMedia]);
      setActiveBackground(assetUrl);
      setCloudSyncStatus('synced');
    } catch (err: any) {
      console.error('Background Upload failed:', err);
      setMediaUploadError(err.message || 'Erro ao fazer upload do background.');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const uploadCustomAudio = async (file: File) => {
    setIsCloudUploading(true);
    setCloudSyncStatus('uploading');
    setMediaUploadError(null);
    console.log('[Upload Flow] Starting uploadCustomAudio with file:', file.name, 'size:', file.size);
    try {
      let assetUrl = '';
      let storagePath: string | undefined;
      let assetId = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        console.log('[Upload Flow] Calling uploadMediaToCloudStorage for audio...');
        const uploadedAsset = await uploadMediaToCloudStorage(file, 'audio');
        console.log('[Upload Flow] Audio upload successful:', uploadedAsset);
        assetUrl = uploadedAsset.url;
        storagePath = uploadedAsset.storagePath;
        assetId = uploadedAsset.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        assetUrl = URL.createObjectURL(file);
      }

      const newMedia: CustomMedia = { 
        id: assetId, 
        name: file.name.replace(/\.[^/.]+$/, ""), 
        url: assetUrl,
        storagePath
      };
      setCustomAudios(prev => [...prev.filter(m => m.id !== newMedia.id), newMedia]);
      setCloudSyncStatus('synced');
    } catch (err: any) {
      console.error("[Upload Flow] Upload custom audio error:", err);
      setMediaUploadError(err.message || 'Erro ao fazer upload do áudio');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const deleteCustomLogo = (id: string) => {
    const target = customLogos.find(m => m.id === id);
    setCustomLogos(prev => prev.filter(media => media.id !== id));
    deleteMediaFromCloudStorage(id, target?.storagePath);
  };

  const deleteCustomWatermark = (id: string) => {
    const target = customWatermarks.find(m => m.id === id);
    setCustomWatermarks(prev => prev.filter(media => media.id !== id));
    deleteMediaFromCloudStorage(id, target?.storagePath);
  };

  const deleteCustomOverlay = (id: string) => {
    const target = customOverlays.find(m => m.id === id);
    setCustomOverlays(prev => prev.filter(media => media.id !== id));
    deleteMediaFromCloudStorage(id, target?.storagePath);
  };

  const [hiddenTemplates, setHiddenTemplates] = useState<string[]>(getSaved("pw_hidden_templates", []));

  useEffect(() => {
    localStorage.setItem("pw_hidden_templates", JSON.stringify(hiddenTemplates));
  }, [hiddenTemplates]);

  const hideTemplate = (id: string) => {
    setHiddenTemplates(prev => [...prev, id]);
  };

  const deleteCustomBackground = (id: string) => {
    const target = customBackgrounds.find(m => m.id === id);
    setCustomBackgrounds(prev => prev.filter(media => media.id !== id));
    deleteMediaFromCloudStorage(id, target?.storagePath);
  };

  const deleteCustomAudio = (id: string) => {
    const target = customAudios.find(m => m.id === id);
    setCustomAudios(prev => prev.filter(media => media.id !== id));
    deleteMediaFromCloudStorage(id, target?.storagePath);
  };

  const playVideoClip = (clipId: string) => {
    setVideoClips(prev => prev.map(clip => {
      if (clip.id === clipId) {
        const nextState = !clip.isPlaying;
        if (nextState) {
          setActiveVideoClip({ ...clip, isPlaying: true });
        } else {
          setActiveVideoClip(null);
        }
        return { ...clip, isPlaying: nextState };
      }
      return { ...clip, isPlaying: false };
    }));
  };

  const uploadVideoClip = async (file: File) => {
    setIsCloudUploading(true);
    setMediaUploadError(null);
    try {
      let clipUrl = '';
      let storagePath: string | undefined;
      let clipId = `vc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const uploaded = await uploadMediaToCloudStorage(file, 'video');
        clipUrl = uploaded.url;
        storagePath = uploaded.storagePath;
        clipId = uploaded.id;
      } catch (cloudErr) {
        console.warn('Cloud upload failed, fallback to local Blob URL:', cloudErr);
        clipUrl = URL.createObjectURL(file);
      }

      const newClip: VideoClip = {
        id: clipId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        duration: storagePath ? 'Vídeo na Nuvem' : 'Vídeo Local',
        url: clipUrl,
        isPlaying: true,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
        isCustom: true,
        storagePath
      };

      setVideoClips(prev => {
        const filtered = prev.filter(c => 
          c.id !== newClip.id && 
          (!storagePath || c.storagePath !== storagePath) && 
          c.name.trim().toLowerCase() !== newClip.name.trim().toLowerCase()
        );
        return [...filtered.map(c => ({ ...c, isPlaying: false })), newClip];
      });
      setActiveVideoClip(newClip);
    } catch (err: any) {
      console.error('Video clip upload failed:', err);
      setMediaUploadError(err.message || 'Erro no servidor ou permissão negada ao fazer upload do vídeo.');
    } finally {
      setIsCloudUploading(false);
    }
  };

  const deleteVideoClip = (id: string) => {
    const target = videoClips.find(c => c.id === id);
    const targetName = target?.name.trim().toLowerCase();
    const targetPath = target?.storagePath;

    setVideoClips(prev => prev.filter(c => {
      if (c.id === id) return false;
      if (targetPath && c.storagePath === targetPath) return false;
      if (targetName && c.name.trim().toLowerCase() === targetName) return false;
      return true;
    }));

    if (activeVideoClip && (
      activeVideoClip.id === id ||
      (targetPath && activeVideoClip.storagePath === targetPath) ||
      (targetName && activeVideoClip.name.trim().toLowerCase() === targetName)
    )) {
      setActiveVideoClip(null);
      localStorage.removeItem('pwstreamer_activeVideoClip');
    }

    deleteMediaFromCloudStorage(id, targetPath);
  };

  return (
    <MediaManagerContext.Provider value={{
      activeLogo,
      setActiveLogo,
      activeWatermark,
      setActiveWatermark,
      activeOverlay,
      setActiveOverlay,
      activeBackground,
      setActiveBackground,
      customLogos,
      customWatermarks,
      customOverlays,
      customBackgrounds,
      customAudios,
      uploadCustomLogo,
      uploadCustomWatermark,
      uploadCustomOverlay,
      uploadCustomBackground,
      uploadCustomAudio,
      deleteCustomLogo,
      deleteCustomWatermark,
      deleteCustomOverlay,
      deleteCustomBackground,
      deleteCustomAudio,
      hiddenTemplates,
      hideTemplate,
      videoClips,
      activeVideoClip,
      setActiveVideoClip,
      playVideoClip,
      uploadVideoClip,
      deleteVideoClip,
      isCloudUploading,
      cloudSyncStatus,
      mediaUploadError,
      setMediaUploadError
    }}>
      {children}
    </MediaManagerContext.Provider>
  );
}

export function useMediaManager() {
  const context = useContext(MediaManagerContext);
  if (context === undefined) {
    throw new Error('useMediaManager must be used within a MediaManagerProvider');
  }
  return context;
}
