import { getApiBaseUrl } from '../api/client';
import { getTokens } from '../storage/secure';

function normalizeUploadUri(uri: string) {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

function resolveAudioUploadMeta(uri: string) {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith('.wav')) return { name: 'recording.wav', type: 'audio/wav' };
  if (lowerUri.endsWith('.3gp')) return { name: 'recording.3gp', type: 'audio/3gpp' };
  return { name: 'recording.m4a', type: 'audio/mp4' };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scorePronunciationAttempt(expectedSentence: string, transcript: string) {
  const expectedTokens = normalizeText(expectedSentence).split(' ').filter(Boolean);
  const actualTokens = normalizeText(transcript).split(' ').filter(Boolean);

  if (expectedTokens.length === 0) {
    return { score: 0, status: 'Try again' as const };
  }

  let matched = 0;
  expectedTokens.forEach((token, index) => {
    if (actualTokens[index] === token) matched += 1;
  });

  const score = Math.round((matched / expectedTokens.length) * 100);

  if (score >= 90) return { score, status: 'Excellent' as const };
  if (score >= 70) return { score, status: 'Good' as const };
  if (score >= 45) return { score, status: 'Almost there' as const };
  return { score, status: 'Try again' as const };
}

export async function uploadAudioForPreviewTranscript(rawUri: string) {
  const baseUrl = await getApiBaseUrl();
  const tokens = await getTokens();
  const uri = normalizeUploadUri(rawUri);
  const fileMeta = resolveAudioUploadMeta(uri);

  return await new Promise<{ transcript: string }>((resolve, reject) => {
    const form = new FormData();
    form.append('audioFile', {
      uri,
      name: fileMeta.name,
      type: fileMeta.type,
    } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/api/conversations/transcribe-preview`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (tokens?.accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${tokens.accessToken}`);
    }

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Ses yukleme zaman asimina ugradi'));
    xhr.timeout = 45000;
    xhr.onload = () => {
      const raw = xhr.responseText || '';
      let payload: any = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = raw;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as { transcript: string });
        return;
      }

      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : payload && typeof payload === 'object' && 'detail' in payload
            ? String(payload.detail)
            : `Request failed (${xhr.status})`;
      reject(new Error(message));
    };

    xhr.send(form);
  });
}
