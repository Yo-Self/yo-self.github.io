const fs = require('fs');

// Função para gerar um som de sino simples
function generateBellSound() {
  const sampleRate = 44100;
  const duration = 2.0; // 2 segundos
  const numSamples = Math.floor(sampleRate * duration);
  
  // Criar array de dados de áudio
  const audioData = new Float32Array(numSamples);
  
  // Frequência base do sino (aproximadamente 800Hz)
  const baseFreq = 800;
  
  // Harmônicos do sino
  const harmonics = [
    { freq: baseFreq, amplitude: 1.0, decay: 0.1 },
    { freq: baseFreq * 2, amplitude: 0.5, decay: 0.15 },
    { freq: baseFreq * 3, amplitude: 0.3, decay: 0.2 },
    { freq: baseFreq * 4, amplitude: 0.2, decay: 0.25 }
  ];
  
  // Gerar o som
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;
    
    // Adicionar cada harmônico
    harmonics.forEach(harmonic => {
      const envelope = Math.exp(-time / harmonic.decay);
      sample += harmonic.amplitude * envelope * Math.sin(2 * Math.PI * harmonic.freq * time);
    });
    
    // Aplicar envelope geral
    const overallEnvelope = Math.exp(-time / 0.5);
    audioData[i] = sample * overallEnvelope * 0.3; // Reduzir volume
  }
  
  return audioData;
}

// Converter para WAV
function float32ToWav(audioData, sampleRate) {
  const numChannels = 1;
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);
  
  // Dados de áudio
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return arrayBuffer;
}

// Gerar e salvar o arquivo
try {
  console.log('Gerando som de sino...');
  const bellData = generateBellSound();
  const wavData = float32ToWav(bellData, 44100);
  const buffer = Buffer.from(wavData);
  
  // Salvar como WAV
  fs.writeFileSync('public/restaurant-bell.wav', buffer);
  console.log('Som de sino gerado com sucesso: public/restaurant-bell.wav');
  
  // Tentar converter para MP3 usando ffmpeg (se disponível)
  try {
    const { execSync } = require('child_process');
    execSync('ffmpeg -i public/restaurant-bell.wav -acodec mp3 -ab 128k public/restaurant-bell.mp3 -y', { stdio: 'ignore' });
    console.log('Arquivo MP3 criado: public/restaurant-bell.mp3');
  } catch (error) {
    console.log('ffmpeg não encontrado. Arquivo WAV salvo: public/restaurant-bell.wav');
    console.log('Para converter para MP3, instale o ffmpeg e execute:');
    console.log('ffmpeg -i public/restaurant-bell.wav -acodec mp3 -ab 128k public/restaurant-bell.mp3');
  }
} catch (error) {
  console.error('Erro ao gerar som:', error);
}
