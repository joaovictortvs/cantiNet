import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Chamado com o texto do QR Code lido (no máximo 1x a cada 3 s para o mesmo texto). */
  onLeitura: (texto: string) => void;
  ativo?: boolean;
}

/**
 * Lê QR Code pela câmera (webcam do notebook ou câmera traseira do tablet).
 * Usa a biblioteca jsQR, que funciona em qualquer navegador moderno.
 * (A API nativa BarcodeDetector não existe no Chrome do Windows.)
 * Requer HTTPS (ou localhost) para acessar a câmera.
 */
export function LeitorQrCamera({ onLeitura, ativo = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Guarda a versão mais recente do callback sem reiniciar a câmera a cada render.
  const callback = useRef(onLeitura);
  callback.current = onLeitura;

  useEffect(() => {
    if (!ativo) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador não dá acesso à câmera (use HTTPS ou localhost). Digite o código CNT-… no campo de conferência.');
      return;
    }

    let parar = false;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let ultimo = { texto: '', em: 0 };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        if (parar) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        await video.play();
        timer = window.setInterval(() => {
          if (!ctx || video.readyState < 2 || !video.videoWidth) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const quadro = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const texto = jsQR(quadro.data, quadro.width, quadro.height, { inversionAttempts: 'dontInvert' })?.data;
          if (texto && (texto !== ultimo.texto || Date.now() - ultimo.em > 3000)) {
            ultimo = { texto, em: Date.now() };
            callback.current(texto);
          }
        }, 250);
      })
      .catch(() => setErro('Não foi possível acessar a câmera. Verifique a permissão do navegador.'));

    return () => {
      parar = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ativo]);

  if (erro) return <p role="alert">{erro}</p>;
  return <video ref={videoRef} muted playsInline style={{ width: '100%', maxWidth: 420, borderRadius: 12 }} />;
}