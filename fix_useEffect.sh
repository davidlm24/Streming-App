sed -i '143,185c\
  // Subscribe to Cloud Firestore Media Assets on user login\
  useEffect(() => {\
    const userEmail = auth.currentUser?.email || "mgdlms@gmail.com";\
    const unsubscribe = subscribeUserMediaAssets(userEmail, (cloudAssets) => {\
      if (!cloudAssets) return;\
\
      const cloudLogos: CustomMedia[] = [];\
      const cloudWatermarks: CustomMedia[] = [];\
      const cloudOverlays: CustomMedia[] = [];\
      const cloudBgs: CustomMedia[] = [];\
\
      cloudAssets.forEach(asset => {\
        const item: CustomMedia = {\
          id: asset.id,\
          name: asset.name,\
          url: asset.url,\
          storagePath: asset.storagePath\
        };\
        if (asset.type === "logo") cloudLogos.push(item);\
        if (asset.type === "watermark") cloudWatermarks.push(item);\
        if (asset.type === "overlay") cloudOverlays.push(item);\
        if (asset.type === "background") cloudBgs.push(item);\
      });\
\
      setCustomLogos(cloudLogos);\
      setCustomWatermarks(cloudWatermarks);\
      setCustomOverlays(cloudOverlays);\
      setCustomBackgrounds(cloudBgs);\
      setCloudSyncStatus("synced");\
    });\
\
    return () => unsubscribe();\
  }, []);\
' src/context/MediaManagerContext.tsx
