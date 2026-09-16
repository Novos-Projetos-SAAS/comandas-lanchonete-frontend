# Teste mobile com HTTPS via Cloudflare Tunnel

Este fluxo é apenas para desenvolvimento e permite testar a câmera ao vivo no iPhone/Android sem expor diretamente a porta do backend.

## Arquitetura local

- Frontend Next.js: `http://localhost:3000`
- Backend Express + Socket.IO: `http://localhost:3001`
- Cloudflare Tunnel: publica somente o frontend em HTTPS
- O Next.js encaminha internamente `/api/*` e `/socket.io/*` para o backend em `localhost:3001`

Assim navegador, cookie HttpOnly, API e Socket.IO usam uma única origem HTTPS.

## 1. Atualizar dependências do frontend

Depois de atualizar a branch, execute no diretório do frontend:

```powershell
npm install
```

Isso instala o ZXing usado pelo leitor de QR e atualiza o `package-lock.json` local.

## 2. Subir o backend

No backend:

```powershell
npm run dev
```

Confirme que está disponível em:

```text
http://localhost:3001/api/publico/estabelecimento
```

## 3. Configurar o frontend

O `.env.local` pode continuar usando o backend local:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Quando a página estiver sendo acessada por HTTPS, o frontend muda automaticamente para `/api` e usa o proxy same-origin do Next.js.

Opcionalmente, se o backend estiver em outra porta local:

```env
DEV_BACKEND_PROXY=http://127.0.0.1:3001
```

## 4. Subir o frontend

```powershell
npm run dev
```

Teste primeiro:

```text
http://localhost:3000
```

## 5. Abrir um Quick Tunnel

Com `cloudflared` instalado, execute em outro terminal:

```powershell
cloudflared tunnel --url http://localhost:3000
```

O comando mostrará uma URL semelhante a:

```text
https://exemplo-aleatorio.trycloudflare.com
```

Abra exatamente essa URL no iPhone ou Android.

## 6. Testar a câmera

Na Home:

1. Toque em **Escanear QR Code**.
2. Toque em **Abrir câmera**.
3. Autorize a câmera.
4. Aponte para o QR Code da mesa.

Se o navegador não liberar vídeo contínuo, use **Tirar foto do QR**. Essa opção abre a câmera/galeria nativa e o ZXing tenta decodificar a imagem.

## Observações

- Não é necessário abrir um segundo Cloudflare Tunnel para o backend.
- Quick Tunnels são somente para desenvolvimento/testes.
- O endereço `trycloudflare.com` muda quando o tunnel é reiniciado.
- Em produção, frontend e backend devem usar HTTPS configurado de forma permanente.
- O Socket.IO inicia por HTTP long-polling e tenta upgrade para WebSocket, mantendo compatibilidade com o proxy do ambiente de desenvolvimento.
