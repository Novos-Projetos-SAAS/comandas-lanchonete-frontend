"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, ImagePlus, Loader2, ScanLine, ShieldAlert, X } from "lucide-react";
import { extrairQrToken } from "@/lib/public-session.mjs";
import styles from "./QrScannerModal.module.css";

export default function QrScannerModal({ aberto, onClose, onToken, atendimento }) {
    const videoRef = useRef(null);
    const inputRef = useRef(null);
    const controlsRef = useRef(null);
    const readerRef = useRef(null);
    const processandoRef = useRef(false);
    const bloqueado = atendimento?.aceitando_pedidos === false;
    const [estado, setEstado] = useState("aguardando");
    const [mensagem, setMensagem] = useState("");

    const pararCamera = useCallback(() => {
        try {
            controlsRef.current?.stop?.();
        } catch {}

        controlsRef.current = null;
        processandoRef.current = false;

        const stream = videoRef.current?.srcObject;
        if (stream?.getTracks) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const concluirLeitura = useCallback((valor) => {
        if (!valor || processandoRef.current) return false;

        const token = extrairQrToken(valor);

        if (!token) {
            setMensagem("Este QR Code não pertence a uma mesa deste estabelecimento.");
            setEstado("erro");
            return false;
        }

        processandoRef.current = true;
        pararCamera();
        onToken(token);
        return true;
    }, [onToken, pararCamera]);

    const obterReader = useCallback(async () => {
        if (readerRef.current) return readerRef.current;

        const { BrowserQRCodeReader } = await import("@zxing/browser");
        readerRef.current = new BrowserQRCodeReader(undefined, {
            delayBetweenScanAttempts: 120,
            delayBetweenScanSuccess: 500
        });

        return readerRef.current;
    }, []);

    const iniciarCamera = useCallback(async () => {
        setMensagem("");

        if (bloqueado) {
            setEstado("bloqueado");
            setMensagem(atendimento?.mensagem || "No momento ainda não estamos recebendo pedidos.");
            return;
        }

        if (!window.isSecureContext) {
            setEstado("indisponivel");
            setMensagem("Para usar a câmera ao vivo, abra esta página por HTTPS. Você ainda pode tirar uma foto do QR Code abaixo.");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setEstado("indisponivel");
            setMensagem("Este navegador não liberou a câmera ao vivo. Use a opção Tirar foto do QR Code.");
            return;
        }

        try {
            pararCamera();
            setEstado("carregando");

            const reader = await obterReader();
            const controls = await reader.decodeFromConstraints(
                {
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                videoRef.current,
                (result) => {
                    if (!result) return;
                    concluirLeitura(result.getText());
                }
            );

            controlsRef.current = controls;
            setEstado("lendo");
        } catch (error) {
            pararCamera();
            setEstado("indisponivel");

            if (error?.name === "NotAllowedError") {
                setMensagem("Permissão da câmera negada. Autorize a câmera no navegador ou use Tirar foto do QR Code.");
            } else if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
                setMensagem("Nenhuma câmera compatível foi encontrada. Use Tirar foto do QR Code.");
            } else {
                setMensagem("Não foi possível abrir a câmera ao vivo. Use Tirar foto do QR Code ou a câmera nativa do aparelho.");
            }
        }
    }, [atendimento?.mensagem, bloqueado, concluirLeitura, obterReader, pararCamera]);

    const lerImagem = useCallback(async (event) => {
        const arquivo = event.target.files?.[0];
        event.target.value = "";

        if (!arquivo || bloqueado) return;

        let objectUrl = null;

        try {
            setMensagem("");
            setEstado("carregando");
            const reader = await obterReader();
            objectUrl = URL.createObjectURL(arquivo);
            const resultado = await reader.decodeFromImageUrl(objectUrl);

            if (!concluirLeitura(resultado.getText())) {
                setEstado("erro");
            }
        } catch {
            setEstado("erro");
            setMensagem("Não conseguimos identificar um QR Code válido nessa imagem. Tente novamente com o código inteiro e bem iluminado.");
        } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
    }, [bloqueado, concluirLeitura, obterReader]);

    useEffect(() => {
        if (!aberto) {
            pararCamera();
            setEstado("aguardando");
            setMensagem("");
            return;
        }

        if (bloqueado) {
            setEstado("bloqueado");
            setMensagem(atendimento?.mensagem || "No momento ainda não estamos recebendo pedidos.");
        } else {
            setEstado("aguardando");
            setMensagem("");
        }

        return pararCamera;
    }, [aberto, atendimento?.mensagem, bloqueado, pararCamera]);

    if (!aberto) return null;

    const cameraAtiva = estado === "lendo" || estado === "carregando";

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
                    <video ref={videoRef} muted playsInline autoPlay />
                    {cameraAtiva && <div className={styles.guide} aria-hidden="true" />}

                    {estado === "aguardando" && (
                        <div className={styles.overlay}>
                            <Camera size={34} />
                            <strong>Câmera pronta para iniciar</strong>
                            <span>Toque no botão abaixo para liberar a câmera traseira.</span>
                        </div>
                    )}

                    {estado === "carregando" && (
                        <div className={`${styles.overlay} ${styles.overlayTransparent}`}>
                            <Loader2 className={styles.spinner} /> Abrindo câmera...
                        </div>
                    )}

                    {["indisponivel", "erro", "bloqueado"].includes(estado) && (
                        <div className={styles.overlay}>
                            <ShieldAlert size={31} />
                            <span>{mensagem}</span>
                        </div>
                    )}
                </div>

                {estado === "lendo" && (
                    <p className={styles.help}>Aponte a câmera traseira para o QR Code disponível na sua mesa.</p>
                )}

                {!bloqueado && (
                    <div className={styles.actions}>
                        {estado !== "lendo" && (
                            <button type="button" className={styles.primaryAction} onClick={iniciarCamera} disabled={estado === "carregando"}>
                                {estado === "carregando" ? <Loader2 className={styles.spinner} size={18} /> : <Camera size={18} />}
                                Abrir câmera
                            </button>
                        )}

                        {estado === "lendo" && (
                            <button type="button" className={styles.secondaryAction} onClick={() => {
                                pararCamera();
                                setEstado("aguardando");
                            }}>
                                Parar câmera
                            </button>
                        )}

                        <button type="button" className={styles.secondaryAction} onClick={() => inputRef.current?.click()}>
                            <ImagePlus size={18} /> Tirar foto do QR
                        </button>

                        <input
                            ref={inputRef}
                            className={styles.fileInput}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={lerImagem}
                        />
                    </div>
                )}

                {!bloqueado && (
                    <div className={styles.alternative}>
                        <span>Outra alternativa:</span>
                        <a href="https://lens.google.com/" target="_blank" rel="noreferrer">
                            Abrir Google Lens <ExternalLink size={15} />
                        </a>
                    </div>
                )}
            </section>
        </div>
    );
}
