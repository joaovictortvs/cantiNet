import { useEffect, useRef, useState } from "react";

interface Props {
  /** Chamado com o texto do QR Code lido (no máximo 1x a cada 3 s para o mesmo texto). */
  onLeitura: (texto: string) => void;
  ativo?: boolean;
}

// BarcodeDetector ainda não está nos tipos padrão do TypeScript.
declare const BarcodeDetector: any;

/**
 * Lê QR Code pela câmera do tablet usando a API nativa BarcodeDetector
 * (Chrome/Edge/Android). Em navegadores sem suporte (ex.: Safari), mostra aviso;
 * nesse caso troque por uma lib como "jsqr" ou "@yudiel/react-qr-scanner".
 * Requer HTTPS (ou localhost) para acessar a câmera.
 */
export function LeitorQrCamera({ onLeitura, ativo = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!ativo) return;
    if (typeof BarcodeDetector === "undefined") {
      setErro("Este navegador não lê QR Code pela câmera. Use o código CNT-XXXX.");
      return;
    }

    let parar = false;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let ultimo = { texto: "", em: 0 };
    const detector = new BarcodeDetector({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        if (parar) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play();
        timer = window.setInterval(async () => {
          try {
            const [achado] = await detector.detect(video);
            const texto: string | undefined = achado?.rawValue;
            if (texto && (texto !== ultimo.texto || Date.now() - ultimo.em > 3000)) {
              ultimo = { texto, em: Date.now() };
              onLeitura(texto);
            }
          } catch {
            /* quadro sem imagem: tenta de novo */
          }
        }, 300);
      })
      .catch(() => setErro("Não foi possível acessar a câmera. Verifique a permissão do navegador."));

    return () => {
      parar = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ativo, onLeitura]);

  if (erro) return <p role="alert">{erro}</p>;
  return <video ref={videoRef} muted playsInline style={{ width: "100%", maxWidth: 420, borderRadius: 12 }} />;
}
