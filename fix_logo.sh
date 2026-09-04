sed -i '175a\
\
  const uploadCustomLogo = async (file: File) => {\
    setIsCloudUploading(true);\
    setCloudSyncStatus("uploading");\
    try {' src/context/MediaManagerContext.tsx
