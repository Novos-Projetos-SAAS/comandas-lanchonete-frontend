"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, Loader2, ScanLine, X } from "lucide-react";
import { extrairQrToken } from "@/lib/public-session.mjs";
import { obterEstabelecimentoPublico } from "@/services/publico.service";
import styles from "./QrScannerModal.module.css";

export default function QrScannerModal({ aberto, onClose, onToken }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const detectorRef = useRef(null);
    const lendoRef = useRef(false);
    const [estado, setEstado] = useState("parado");
    const [mensagem, setMensagem] = useState("");

    const pararCamera = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        lendoRef.current = false;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const detectar = useCallback(async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;

        if (!video || !detector || lendoRef.current) return;

        try {
            if (video.readyState >= 2) {
                lendoRef.current = true;
                const codigos = await detector.detect(video);
                lendoRef.current = false;

                const valor = codigos?.[0]?.rawValue;

                if (valor) {
                    const token = extrairQrToken(valor);

                    if (!token) {
                        setMensagem("Este QR Code não pertence a uma mesa deste estabelecimento.");
                        setEstado("erro");
                    } else {
                        pararCamera();
                        onToken(token);
                        return;
                    }
                }
            }
        } catch {
            lendoRef.current = false;
        }

        animationRef.current = requestAnimationFrame(detectar);
    }, [onToken, pararCamera]);

    const iniciarCamera = useCallback(async () => {
        setMensagem("");
        setEstado("carregando");

        try {
            const estabelecimento = await obterEstabelecimentoPublico();
            const atendimento = estabelecimento?.atendimento;

            if (atendimento?.aceitando_pedidos === false) {
                pararCamera();
                setEstado("bloqueado");
                setMensagem(
                    atendimento.mensagem ||
                    "No momento ainda não estamos recebendo pedidos."
                );
                return;
            }
        } catch {
            pararCamera();
            setEstado("indisponivel");
            setMensagem("Não foi possível verificar se o atendimento está disponível. Tente novamente em instantes.");
            return;
        }

        if (!window.isSecureContext) {
            setEstado("indisponivel");
            setMensagem("Para abrir a câmera dentro da página é necessário HTTPS. Neste teste local, use a câmera do iPhone para ler o QR Code.");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setEstado("indisponivel");
            setMensagem("Este navegador não permite acesso à câmera. Use a câmera do celular ou o Google Lens.");
            return;
        }

        if (!("BarcodeDetector" in window)) {
            setEstado("indisponivel");
            setMensagem("A leitura automática de QR não é suportada neste navegador. Use a câmera do celular ou o Google Lens.");
            return;
        }

        try {
            detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: "environment" }
                }
            });

            streamRef.current = stream;

            if (!videoRef.current) {
                pararCamera();
                return;
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setEstado("lendo");
            animationRef.current = requestAnimationFrame(detectar);
        } catch (error) {
            pararCamera();
            setEstado("indisponivel");
            setMensagem(
                error?.name === "NotAllowedError"
                    ? "Permissão da câmera negada. Autorize a câmera no navegador ou use a câmera do celular."
                    : "Não foi possível abrir a câmera. Você pode usar a câmera do celular ou o Google Lens."
            );
        }
    }, [detectar, pararCamera]);

    useEffect(() => {
        if (!aberto) {
            pararCamera();
            setEstado("parado");
            setMensagem("");
            return;
        }

        iniciarCamera();

        return pararCamera;
    }, [aberto, iniciarCamera, pararCamera]);

    if (!aberto) return null;

    return (
        <div className={styles.backdrop} role="presentation" onMouseDown={event => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="qr-title">
                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}><ScanLine size={15} /> Acessar sua mesa</span>
                        <h2 id="qr-title">Leia o QR Code da mesa</h2>
                    </div>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar leitor de QR">
                        <X size={21} />
                    </button>
                </header>

                <div className={styles.camera}>
                    <video ref={videoRef} muted playsInline />
                    <div className={styles.guide} aria-hidden="true" />

                    {estado === "carregando" && (
                        <div className={styles.overlay}><Loader2 className={styles.spinner} /> Verificando atendimento...</div>
                    )}

                    {["indisponivel", "erro", "bloqueado"].includes(estado) && (
                        <div className={styles.overlay}>
                            <Camera size={30} />
                            <span>{mensagem}</span>
                        </div>
                    )}
                </div>

                {estado === "lendo" && (
                    <p className={styles.help}>Aponte a câmera traseira para o QR Code disponível na sua mesa.</p>
                )}

                {estado === "erro" && (
                    <button type="button" className={styles.retry} onClick={iniciarCamera}>Tentar novamente</button>
                )}

                {estado !== "bloqueado" && (
                    <div className={styles.alternative}>
                        <span>Não conseguiu ler?</span>
                        <a href="https://lens.google.com/" target="_blank" rel="noreferrer">
                            Abrir Google Lens <ExternalLink size={15} />
                        </a>
                    </div>
                )}
            </section>
        </div>
    );
}
