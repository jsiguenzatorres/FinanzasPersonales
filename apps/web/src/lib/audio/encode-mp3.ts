import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * MediaRecorder graba en webm/opus (Chrome/Firefox) o mp4/aac (Safari) —
 * Gemini no acepta webm como input de audio. En vez de arrastrar ffmpeg.wasm
 * (~25-30MB de WASM) solo para remuxear, decodificamos con la Web Audio API
 * nativa del navegador (soporta ambos formatos) y recodificamos a MP3 con
 * lamejs, una librería JS pura de ~470KB sin dependencias.
 */
export async function blobToMp3(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();

  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, 96);

  const left = floatTo16BitPCM(audioBuffer.getChannelData(0));
  const right = channels === 2 ? floatTo16BitPCM(audioBuffer.getChannelData(1)) : undefined;

  const chunks: Uint8Array[] = [];
  const blockSize = 1152;
  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right?.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(leftChunk, rightChunk);
    if (encoded.length > 0) chunks.push(encoded);
  }
  const final = encoder.flush();
  if (final.length > 0) chunks.push(final);

  return new Blob(chunks as BlobPart[], { type: 'audio/mp3' });
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]!));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
