export interface CloudflareStreamDetails {
  liveInputId: string;
  customerSubdomain: string;
  
  // Ingest / Broadcast
  rtmpsUrl: string;
  rtmpsKey: string;
  srtUrl: string;
  whipPublishUrl: string;

  // Playback / Output
  playerUrl: string;
  embedIframeCode: string;
  hlsManifestUrl: string;
  dashManifestUrl: string;
  whepPlaybackUrl: string;
  srtPlaybackUrl: string;
  rtmpsPlaybackUrl: string;
  rtmpsPlaybackKey: string;
}

// Configuração segura inicial (sem credenciais mestres expostas no cliente)
export const CLOUDFLARE_STREAM_CONFIG: CloudflareStreamDetails = {
  liveInputId: 'session_dynamic',
  customerSubdomain: 'customer-stream.cloudflare.com',

  // Ingest / Broadcast
  rtmpsUrl: 'rtmps://live.cloudflare.com:443/live/',
  rtmpsKey: 'cf_live_stream_key_auto',
  srtUrl: 'srt://live.cloudflare.com:778',
  whipPublishUrl: 'https://customer-stream.cloudflare.com/webRTC/publish',

  // Playback / Player
  playerUrl: 'https://customer-stream.cloudflare.com/iframe',
  embedIframeCode: `<div style="position: relative; padding-top: 56.25%;">
  <iframe
    src="https://customer-stream.cloudflare.com/iframe"
    style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true"
  ></iframe>
</div>`,
  hlsManifestUrl: 'https://customer-stream.cloudflare.com/manifest/video.m3u8',
  dashManifestUrl: 'https://customer-stream.cloudflare.com/manifest/video.mpd',
  whepPlaybackUrl: 'https://customer-stream.cloudflare.com/webRTC/play',
  srtPlaybackUrl: 'srt://live.cloudflare.com:778',
  rtmpsPlaybackUrl: 'rtmps://live.cloudflare.com:443/live/',
  rtmpsPlaybackKey: 'cf_live_stream_key_auto'
};

/**
 * Solicita ao backend seguro um Live Input dedicado e exclusivo para a transmissão atual,
 * prevenindo compartilhamento ou vazamento de credenciais mestres.
 */
export async function getSecureCloudflareLiveInput(userId = 'anonymous', title = 'Live PwStreamer'): Promise<CloudflareStreamDetails> {
  try {
    const res = await fetch('/api/cloudflare/live-inputs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title })
    });
    
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (data.success) {
      const liveId = data.liveInputId;
      return {
        liveInputId: liveId,
        customerSubdomain: 'customer-stream.cloudflare.com',
        rtmpsUrl: data.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/',
        rtmpsKey: data.rtmps?.key || liveId,
        srtUrl: data.srt?.url || `srt://live.cloudflare.com:778?streamid=${liveId}`,
        whipPublishUrl: data.webRTC?.url || `https://customer-stream.cloudflare.com/${liveId}/webRTC/publish`,
        playerUrl: data.playback?.iframe || `https://customer-stream.cloudflare.com/${liveId}/iframe`,
        embedIframeCode: `<iframe src="${data.playback?.iframe || `https://customer-stream.cloudflare.com/${liveId}/iframe`}" style="border:none;width:100%;height:100%" allowfullscreen></iframe>`,
        hlsManifestUrl: data.playback?.hls || `https://customer-stream.cloudflare.com/${liveId}/manifest/video.m3u8`,
        dashManifestUrl: data.playback?.dash || `https://customer-stream.cloudflare.com/${liveId}/manifest/video.mpd`,
        whepPlaybackUrl: data.webRTC?.play || `https://customer-stream.cloudflare.com/${liveId}/webRTC/play`,
        srtPlaybackUrl: `srt://live.cloudflare.com:778?streamid=play${liveId}`,
        rtmpsPlaybackUrl: 'rtmps://live.cloudflare.com:443/live/',
        rtmpsPlaybackKey: liveId
      };
    }
  } catch (err) {
    console.warn('[Cloudflare Stream] Usando configuração de fallback segura:', err);
  }

  return CLOUDFLARE_STREAM_CONFIG;
}
